import { useState } from "react";

const UserCard = ({ user, onConnect, onChat }) => {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(user.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (error) {
      setCopied(false);
    }
  };

  return (
    <article className="user-card">
      <div className="user-card-head">
        <h3>{user.name}</h3>
        <span className={`status-badge ${user.isConnected ? "status-connected" : "status-open"}`}>
          {user.isConnected ? "Connected" : "Open to connect"}
        </span>
      </div>

      <div>
        <p className="muted">{user.email}</p>
        <p className="rating-line">
          Rating: {Number(user.averageRating || 0).toFixed(1)} / 5 ({user.ratingCount || 0} reviews)
        </p>
        {typeof user.matchScore === "number" && (
          <p className="match-line">Match score: {(user.matchScore * 100).toFixed(0)}%</p>
        )}
      </div>

      <p>{user.bio || "No bio added yet."}</p>

      <div className="chip-group">
        {user.skillsOffered?.length ? (
          user.skillsOffered.map((skill) => (
            <span key={`offered-${user._id}-${skill}`} className="chip chip-offered">
              Offers: {skill}
            </span>
          ))
        ) : (
          <span className="chip">No offered skills</span>
        )}
      </div>

      <div className="chip-group">
        {user.skillsWanted?.length ? (
          user.skillsWanted.map((skill) => (
            <span key={`wanted-${user._id}-${skill}`} className="chip chip-wanted">
              Wants: {skill}
            </span>
          ))
        ) : (
          <span className="chip">No wanted skills</span>
        )}
      </div>

      <div className="button-row">
        <button type="button" className="btn btn-secondary" onClick={copyEmail}>
          {copied ? "Copied" : "Copy Email"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onConnect(user)}
          disabled={Boolean(user.isConnected)}
        >
          {user.isConnected ? "Connected" : "Connect"}
        </button>
        <button type="button" className="btn btn-primary" onClick={() => onChat(user)}>
          Chat
        </button>
      </div>

      {typeof user.matchScore === "number" && (
        <div className="match-meter">
          <div className="match-meter-bar" style={{ width: `${Math.max(8, user.matchScore * 100)}%` }} />
        </div>
      )}
    </article>
  );
};

export default UserCard;
