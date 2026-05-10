import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Alert from "../components/Alert";
import LoadingSpinner from "../components/LoadingSpinner";
import UserCard from "../components/UserCard";
import { useAuth } from "../context/AuthContext";
import {
  connectUser,
  getMatches,
  getProfile,
  getUsers,
  updateProfile,
} from "../services/userService";

const joinSkills = (skills = []) => skills.join(", ");
const parseSkills = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const DashboardPage = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();

  const [profileForm, setProfileForm] = useState({
    name: "",
    bio: "",
    skillsOffered: "",
    skillsWanted: "",
  });
  const [users, setUsers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showConnectedOnly, setShowConnectedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hydrateProfileForm = (profile) => {
    setProfileForm({
      name: profile.name || "",
      bio: profile.bio || "",
      skillsOffered: joinSkills(profile.skillsOffered),
      skillsWanted: joinSkills(profile.skillsWanted),
    });
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [profileRes, usersRes, matchesRes] = await Promise.all([
        getProfile(),
        getUsers(),
        getMatches(),
      ]);
      hydrateProfileForm(profileRes.user);
      setCurrentUser(profileRes.user);
      setUsers(usersRes.users || []);
      setMatches(matchesRes.matches || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setSuccess("");
    setError("");

    try {
      setSaving(true);
      const payload = {
        name: profileForm.name.trim(),
        bio: profileForm.bio.trim(),
        skillsOffered: parseSkills(profileForm.skillsOffered),
        skillsWanted: parseSkills(profileForm.skillsWanted),
      };

      const response = await updateProfile(payload);
      hydrateProfileForm(response.user);
      setCurrentUser(response.user);
      setSuccess(response.message || "Profile updated successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = async (selectedUser) => {
    try {
      setError("");
      const response = await connectUser(selectedUser._id);
      setSuccess(response.message || `Connected with ${selectedUser.name}`);

      setUsers((prevUsers) =>
        prevUsers.map((person) =>
          person._id === selectedUser._id
            ? { ...person, isConnected: true }
            : person,
        ),
      );

      setMatches((prevMatches) =>
        prevMatches.map((person) =>
          person._id === selectedUser._id
            ? { ...person, isConnected: true }
            : person,
        ),
      );
    } catch (err) {
      setError(err.response?.data?.message || "Could not connect right now.");
    }
  };

  const handleChat = (selectedUser) => {
    navigate(`/chat/${selectedUser._id}`);
  };

  const normalizeText = (value = "") => String(value).toLowerCase().trim();

  const matchesView = useMemo(() => {
    const query = normalizeText(searchQuery);
    const result = [...matches]
      .filter((person) => {
        const searchable = `${person.name} ${person.bio} ${(person.skillsOffered || []).join(" ")} ${(person.skillsWanted || []).join(" ")}`;
        const matchesQuery =
          !query || normalizeText(searchable).includes(query);
        const matchesConnectedFilter = showConnectedOnly
          ? person.isConnected
          : true;
        return matchesQuery && matchesConnectedFilter;
      })
      .sort((a, b) => {
        if (sortBy === "rating") {
          return (b.averageRating || 0) - (a.averageRating || 0);
        }
        if (sortBy === "newest") {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        return (b.matchScore || 0) - (a.matchScore || 0);
      });

    return result;
  }, [matches, searchQuery, showConnectedOnly, sortBy]);

  const usersView = useMemo(() => {
    const query = normalizeText(searchQuery);
    const result = [...users]
      .filter((person) => {
        const searchable = `${person.name} ${person.bio} ${(person.skillsOffered || []).join(" ")} ${(person.skillsWanted || []).join(" ")}`;
        const matchesQuery =
          !query || normalizeText(searchable).includes(query);
        const matchesConnectedFilter = showConnectedOnly
          ? person.isConnected
          : true;
        return matchesQuery && matchesConnectedFilter;
      })
      .sort((a, b) => {
        if (sortBy === "rating") {
          return (b.averageRating || 0) - (a.averageRating || 0);
        }
        if (sortBy === "newest") {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        return (b.ratingCount || 0) - (a.ratingCount || 0);
      });

    return result;
  }, [users, searchQuery, showConnectedOnly, sortBy]);

  const connectedCount = users.filter((person) => person.isConnected).length;

  if (loading) {
    return (
      <section className="container">
        <LoadingSpinner text="Loading your dashboard..." />
      </section>
    );
  }

  return (
    <section className="dashboard container">
      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <div className="dashboard-grid">
        <article className="card profile-card">
          <h2>Your Profile</h2>
          <p className="muted">
            Update your details to attract better skill matches.
          </p>

          <form onSubmit={handleProfileSave} className="form-grid">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              value={profileForm.name}
              onChange={handleProfileChange}
              required
            />

            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              rows="4"
              value={profileForm.bio}
              onChange={handleProfileChange}
            />

            <label htmlFor="skillsOffered">
              Skills Offered (comma separated)
            </label>
            <input
              id="skillsOffered"
              name="skillsOffered"
              value={profileForm.skillsOffered}
              onChange={handleProfileChange}
              placeholder="JavaScript, Photography"
            />

            <label htmlFor="skillsWanted">
              Skills Wanted (comma separated)
            </label>
            <input
              id="skillsWanted"
              name="skillsWanted"
              value={profileForm.skillsWanted}
              onChange={handleProfileChange}
              placeholder="Machine Learning, Video Editing"
            />

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </article>

        <article className="card users-card">
          <h2>Smart Controls</h2>
          <p className="muted">
            Filter people quickly and focus on the best connections.
          </p>

          <div className="dashboard-tools">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name, bio, or skill..."
            />
            <div className="inline-controls">
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={showConnectedOnly}
                  onChange={(event) =>
                    setShowConnectedOnly(event.target.checked)
                  }
                />
                Show connected only
              </label>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="relevance">Sort: Relevance</option>
                <option value="rating">Sort: Highest rating</option>
                <option value="newest">Sort: Newest users</option>
              </select>
            </div>
          </div>

          <div className="stat-grid">
            <div className="stat-card">
              <span>Total users</span>
              <strong>{users.length}</strong>
            </div>
            <div className="stat-card">
              <span>Connected</span>
              <strong>{connectedCount}</strong>
            </div>
            <div className="stat-card">
              <span>Top matches</span>
              <strong>{matches.length}</strong>
            </div>
          </div>
        </article>

        <article className="card users-card users-card-full">
          <div className="row-head">
            <h2>Recommended Matches</h2>
          </div>

          {matchesView.length === 0 ? (
            <div className="empty-state">
              <h3>No match suggestions yet</h3>
              <p>Update your profile skills to get better recommendations.</p>
            </div>
          ) : (
            <div className="users-grid">
              {matchesView.slice(0, 6).map((person) => (
                <UserCard
                  key={`match-${person._id}`}
                  user={person}
                  onConnect={handleConnect}
                  onChat={handleChat}
                />
              ))}
            </div>
          )}
        </article>

        <article className="card users-card users-card-full">
          <div className="row-head">
            <h2>Discover People</h2>
            <button
              className="btn btn-secondary"
              onClick={loadDashboard}
              type="button"
            >
              Refresh
            </button>
          </div>

          {usersView.length === 0 ? (
            <div className="empty-state">
              <h3>No users found</h3>
              <p>
                Invite your classmates to join SkillSwap and start connecting.
              </p>
            </div>
          ) : (
            <div className="users-grid">
              {usersView.map((person) => (
                <UserCard
                  key={person._id}
                  user={person}
                  onConnect={handleConnect}
                  onChat={handleChat}
                />
              ))}
            </div>
          )}
        </article>
      </div>
    </section>
  );
};

export default DashboardPage;
