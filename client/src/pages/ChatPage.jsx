import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Alert from "../components/Alert";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { getCallSignals, getConversation, sendCallSignal, sendMessage } from "../services/chatService";
import {
  connectUser,
  getReviewsForUser,
  submitReview,
} from "../services/userService";

const rtcConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const ChatPage = () => {
  const { userId } = useParams();
  const { user } = useAuth();

  const currentUserId = useMemo(() => user?.id || user?._id, [user]);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const isCallActiveRef = useRef(false);
  const incomingTimeoutRef = useRef(null);
  const ringtoneIntervalRef = useRef(null);

  const [chatPartner, setChatPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const [incomingOffer, setIncomingOffer] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callStatus, setCallStatus] = useState("Call not started");
  const [callSeconds, setCallSeconds] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    isCallActiveRef.current = isCallActive;
  }, [isCallActive]);

  const formatCallTime = (totalSeconds) => {
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const stopIncomingTone = () => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
    if (incomingTimeoutRef.current) {
      clearTimeout(incomingTimeoutRef.current);
      incomingTimeoutRef.current = null;
    }
  };

  const playIncomingToneTick = () => {
    try {
      const AudioContextRef = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextRef) {
        return;
      }
      const audioCtx = new AudioContextRef();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 760;
      gainNode.gain.value = 0.03;

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);

      setTimeout(() => audioCtx.close(), 260);
    } catch (toneError) {
      // Keep UX resilient if audio playback is blocked by browser policies.
    }
  };

  const loadConversation = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      const data = await getConversation(userId);
      setChatPartner(data.withUser || null);
      setMessages(data.messages || []);
      if (!silent) {
        setError("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not load conversation.");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const loadReviews = async (silent = false) => {
    try {
      if (!silent) {
        setLoadingReviews(true);
      }

      const data = await getReviewsForUser(userId);
      setReviews(data.reviews || []);

      setChatPartner((prev) =>
        prev
          ? {
              ...prev,
              averageRating: data.user?.averageRating ?? prev.averageRating ?? 0,
              ratingCount: data.user?.ratingCount ?? prev.ratingCount ?? 0,
            }
          : prev
      );
    } catch (err) {
      if (!silent) {
        setError(err.response?.data?.message || "Could not load reviews.");
      }
    } finally {
      if (!silent) {
        setLoadingReviews(false);
      }
    }
  };

  const clearCallResources = () => {
    stopIncomingTone();

    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setIsMicMuted(false);
    setIsCameraOff(false);
    setCallSeconds(0);
  };

  const endCall = async (notifyPeer = true) => {
    try {
      if (notifyPeer && chatPartner?.isConnected) {
        await sendCallSignal({ toUserId: userId, type: "end", payload: {} });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not end call cleanly.");
    } finally {
      clearCallResources();
      setIncomingOffer(null);
      setIsCallActive(false);
      setCallStatus("Call ended");
    }
  };

  const ensureLocalStream = async () => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    return stream;
  };

  const createPeerConnection = () => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const peerConnection = new RTCPeerConnection(rtcConfig);

    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      setCallStatus("In call");
      setIsCallActive(true);
    };

    peerConnection.onicecandidate = async (event) => {
      if (!event.candidate) {
        return;
      }

      try {
        await sendCallSignal({
          toUserId: userId,
          type: "ice-candidate",
          payload: {
            candidate: event.candidate?.toJSON ? event.candidate.toJSON() : event.candidate,
          },
        });
      } catch (err) {
        setError(err.response?.data?.message || "Could not share call connectivity details.");
      }
    };

    peerConnection.onconnectionstatechange = () => {
      if (["disconnected", "failed", "closed"].includes(peerConnection.connectionState)) {
        clearCallResources();
        setIsCallActive(false);
        setCallStatus("Call disconnected");
      }
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  };

  const attachLocalTracks = async () => {
    const stream = await ensureLocalStream();
    const peerConnection = createPeerConnection();

    const existingTrackIds = peerConnection
      .getSenders()
      .map((sender) => sender.track?.id)
      .filter(Boolean);

    stream.getTracks().forEach((track) => {
      if (!existingTrackIds.includes(track.id)) {
        peerConnection.addTrack(track, stream);
      }
    });
  };

  const startCall = async () => {
    if (!chatPartner?.isConnected) {
      setError("Connect with this user before starting a video call.");
      return;
    }

    try {
      setError("");
      setSuccess("");
      setCallStatus("Starting call...");
      setCallSeconds(0);
      await attachLocalTracks();

      const peerConnection = createPeerConnection();
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      await sendCallSignal({
        toUserId: userId,
        type: "offer",
        payload: { sdp: { type: offer.type, sdp: offer.sdp } },
      });

      setIsCallActive(true);
      setCallStatus("Calling...");
    } catch (err) {
      clearCallResources();
      setIsCallActive(false);
      setCallStatus("Call failed to start");
      setError(err.response?.data?.message || "Unable to start video call.");
    }
  };

  const acceptIncomingCall = async () => {
    if (!incomingOffer) {
      return;
    }

    try {
      setError("");
      setCallStatus("Connecting...");
      setCallSeconds(0);
      await attachLocalTracks();

      const peerConnection = createPeerConnection();
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(incomingOffer.payload.sdp)
      );

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      await sendCallSignal({
        toUserId: userId,
        type: "answer",
        payload: { sdp: { type: answer.type, sdp: answer.sdp } },
      });

      setIncomingOffer(null);
      setIsCallActive(true);
      setCallStatus("In call");
    } catch (err) {
      clearCallResources();
      setIncomingOffer(null);
      setIsCallActive(false);
      setCallStatus("Call failed");
      setError(err.response?.data?.message || "Unable to accept call.");
    }
  };

  const rejectIncomingCall = async () => {
    try {
      await sendCallSignal({
        toUserId: userId,
        type: "reject",
        payload: {},
      });
    } catch (err) {
      setError(err.response?.data?.message || "Could not reject call.");
    } finally {
      setIncomingOffer(null);
      setCallStatus("Call rejected");
    }
  };

  const processSignals = async (silent = true) => {
    try {
      const data = await getCallSignals(userId);
      const signals = data.signals || [];

      for (const signal of signals) {
        if (signal.type === "offer") {
          if (isCallActiveRef.current) {
            await sendCallSignal({
              toUserId: userId,
              type: "reject",
              payload: { reason: "user-busy" },
            });
          } else {
            setIncomingOffer(signal);
            setCallStatus("Incoming call...");
          }
        }

        if (signal.type === "answer" && peerConnectionRef.current && signal.payload?.sdp) {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(signal.payload.sdp)
          );
          setCallStatus("In call");
          setIsCallActive(true);
        }

        if (
          signal.type === "ice-candidate" &&
          peerConnectionRef.current &&
          signal.payload?.candidate
        ) {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(signal.payload.candidate)
          );
        }

        if (signal.type === "end") {
          clearCallResources();
          setIncomingOffer(null);
          setIsCallActive(false);
          setCallStatus("Call ended by other user");
        }

        if (signal.type === "reject") {
          clearCallResources();
          setIncomingOffer(null);
          setIsCallActive(false);
          setCallStatus("Call was rejected");
        }
      }
    } catch (err) {
      if (!silent) {
        setError(err.response?.data?.message || "Could not sync call status.");
      }
    }
  };

  useEffect(() => {
    loadConversation();
    loadReviews();

    const messageInterval = setInterval(() => {
      loadConversation(true);
    }, 5000);

    const signalInterval = setInterval(() => {
      processSignals(true);
    }, 2000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(signalInterval);
      clearCallResources();
    };
  }, [userId]);

  useEffect(() => {
    if (!incomingOffer) {
      stopIncomingTone();
      return undefined;
    }

    playIncomingToneTick();
    ringtoneIntervalRef.current = setInterval(playIncomingToneTick, 1400);
    incomingTimeoutRef.current = setTimeout(async () => {
      try {
        await sendCallSignal({
          toUserId: userId,
          type: "reject",
          payload: { reason: "missed-call-timeout" },
        });
      } catch (err) {
        // Keep timeout silent to avoid noisy UI if peer already ended the call.
      } finally {
        setIncomingOffer(null);
        setCallStatus("Missed call");
      }
    }, 30000);

    return () => {
      stopIncomingTone();
    };
  }, [incomingOffer, userId]);

  useEffect(() => {
    if (!isCallActive) {
      return undefined;
    }

    const timerId = setInterval(() => {
      setCallSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [isCallActive]);

  const toggleMic = () => {
    if (!localStreamRef.current) {
      return;
    }

    const audioTracks = localStreamRef.current.getAudioTracks();
    if (audioTracks.length === 0) {
      return;
    }

    const nextMuted = !isMicMuted;
    audioTracks.forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsMicMuted(nextMuted);
  };

  const toggleCamera = () => {
    if (!localStreamRef.current) {
      return;
    }

    const videoTracks = localStreamRef.current.getVideoTracks();
    if (videoTracks.length === 0) {
      return;
    }

    const nextCameraOff = !isCameraOff;
    videoTracks.forEach((track) => {
      track.enabled = !nextCameraOff;
    });
    setIsCameraOff(nextCameraOff);
  };

  const handleSend = async (event) => {
    event.preventDefault();
    const trimmedMessage = messageText.trim();

    if (!trimmedMessage) {
      return;
    }

    try {
      setSending(true);
      setError("");

      const data = await sendMessage({ receiverId: userId, message: trimmedMessage });
      setMessageText("");

      if (data.chat) {
        setMessages((prev) => [...prev, data.chat]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Message could not be sent.");
    } finally {
      setSending(false);
    }
  };

  const handleConnect = async () => {
    try {
      const data = await connectUser(userId);
      setSuccess(data.message || "Connected successfully");
      setChatPartner((prev) => (prev ? { ...prev, isConnected: true } : prev));
    } catch (err) {
      setError(err.response?.data?.message || "Could not connect with this user.");
    }
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    try {
      setReviewSubmitting(true);
      setError("");
      const payload = {
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment.trim(),
      };
      const data = await submitReview(userId, payload);
      setSuccess(data.message || "Review submitted");
      setReviewForm({ rating: 5, comment: "" });
      await loadReviews(true);
      await loadConversation(true);
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit review.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const isOwnMessage = (msg) => {
    const senderId = msg.sender?._id || msg.sender?.id || msg.sender;
    return senderId === currentUserId;
  };

  if (loading) {
    return (
      <section className="container">
        <LoadingSpinner text="Loading chat..." />
      </section>
    );
  }

  return (
    <section className="chat container">
      <div className="row-head">
        <div>
          <p className="muted">Conversation with</p>
          <h2>{chatPartner?.name || "User"}</h2>
          <p className="muted">
            Rating: {Number(chatPartner?.averageRating || 0).toFixed(1)} / 5 (
            {chatPartner?.ratingCount || 0} reviews)
          </p>
        </div>
        <div className="button-row">
          {!chatPartner?.isConnected && (
            <button type="button" className="btn btn-secondary" onClick={handleConnect}>
              Connect First
            </button>
          )}
          {!isCallActive ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={startCall}
              disabled={!chatPartner?.isConnected}
            >
              Start Video Call
            </button>
          ) : (
            <>
              <button type="button" className="btn btn-secondary" onClick={toggleMic}>
                {isMicMuted ? "Unmute Mic" : "Mute Mic"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={toggleCamera}>
                {isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
              </button>
              <button type="button" className="btn btn-danger" onClick={() => endCall(true)}>
                End Call
              </button>
            </>
          )}
          <button type="button" className="btn btn-secondary" onClick={() => loadConversation()}>
            Refresh
          </button>
          <Link to="/dashboard" className="btn btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      {incomingOffer && (
        <div className="card incoming-call">
          <p>{chatPartner?.name || "User"} is calling you. Auto-decline in 30 seconds.</p>
          <div className="button-row">
            <button type="button" className="btn btn-primary" onClick={acceptIncomingCall}>
              Accept
            </button>
            <button type="button" className="btn btn-secondary" onClick={rejectIncomingCall}>
              Decline
            </button>
          </div>
        </div>
      )}

      <div className="card video-grid">
        <div className="call-status-wrap">
          <span className={`status-badge ${isCallActive ? "status-connected" : "status-open"}`}>
            {callStatus}
          </span>
          {isCallActive && <span className="call-timer">{formatCallTime(callSeconds)}</span>}
        </div>
        <div className="video-panel">
          <p>Your Video</p>
          <video ref={localVideoRef} autoPlay muted playsInline className="video-frame" />
        </div>
        <div className="video-panel">
          <p>{chatPartner?.name || "User"}'s Video</p>
          <video ref={remoteVideoRef} autoPlay playsInline className="video-frame" />
        </div>
      </div>

      <div className="chat-box card">
        {messages.length === 0 ? (
          <div className="empty-state">
            <h3>No messages yet</h3>
            <p>Say hello and start your skill exchange.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`bubble-row ${isOwnMessage(msg) ? "bubble-row-own" : "bubble-row-other"}`}
            >
              <div className={`bubble ${isOwnMessage(msg) ? "bubble-own" : "bubble-other"}`}>
                <p>{msg.message}</p>
                <span>{new Date(msg.timestamp).toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSend} className="chat-form card">
        <input
          type="text"
          placeholder="Type your message..."
          value={messageText}
          onChange={(event) => setMessageText(event.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={sending}>
          {sending ? "Sending..." : "Send"}
        </button>
      </form>

      <section className="card review-section">
        <div className="row-head">
          <h3>Reviews</h3>
          {loadingReviews && <span className="muted">Loading reviews...</span>}
        </div>

        {reviews.length === 0 ? (
          <div className="empty-state">
            <h3>No reviews yet</h3>
            <p>Share your experience after working together.</p>
          </div>
        ) : (
          <div className="review-list">
            {reviews.map((review) => (
              <article key={review._id} className="review-card">
                <div className="row-head">
                  <strong>{review.reviewer?.name || "Anonymous"}</strong>
                  <span>{review.rating}/5</span>
                </div>
                <p>{review.comment || "No written comment."}</p>
                <span className="muted">{new Date(review.createdAt).toLocaleString()}</span>
              </article>
            ))}
          </div>
        )}

        <form onSubmit={handleReviewSubmit} className="form-grid review-form">
          <label htmlFor="rating">Your Rating</label>
          <select
            id="rating"
            value={reviewForm.rating}
            onChange={(event) =>
              setReviewForm((prev) => ({ ...prev, rating: Number(event.target.value) }))
            }
          >
            <option value={5}>5 - Excellent</option>
            <option value={4}>4 - Good</option>
            <option value={3}>3 - Average</option>
            <option value={2}>2 - Poor</option>
            <option value={1}>1 - Very Poor</option>
          </select>

          <label htmlFor="comment">Comment</label>
          <textarea
            id="comment"
            rows="3"
            value={reviewForm.comment}
            onChange={(event) => setReviewForm((prev) => ({ ...prev, comment: event.target.value }))}
            placeholder="Write a short review..."
          />

          <button type="submit" className="btn btn-primary" disabled={reviewSubmitting}>
            {reviewSubmitting ? "Saving..." : "Submit Review"}
          </button>
        </form>
      </section>
    </section>
  );
};

export default ChatPage;
