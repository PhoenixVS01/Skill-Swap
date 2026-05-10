import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import Alert from "../components/Alert";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";

const toArray = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    bio: "",
    skillsOffered: "",
    skillsWanted: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      setLoading(true);
      const payload = {
        ...formData,
        skillsOffered: toArray(formData.skillsOffered),
        skillsWanted: toArray(formData.skillsWanted),
      };

      const data = await signup(payload);
      setSuccess(data.message || "Signup successful");
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to signup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-section container">
      <div className="auth-card card">
        <h2>Create your account</h2>
        <p className="muted">Join SkillSwap and start exchanging skills.</p>

        <Alert type="error" message={error} />
        <Alert type="success" message={success} />

        <form onSubmit={handleSubmit} className="form-grid">
          <label htmlFor="name">Full Name</label>
          <input id="name" name="name" value={formData.name} onChange={handleChange} required />

          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            minLength="6"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <label htmlFor="bio">Bio (Optional)</label>
          <textarea id="bio" name="bio" rows="3" value={formData.bio} onChange={handleChange} />

          <label htmlFor="skillsOffered">Skills Offered (comma separated)</label>
          <input
            id="skillsOffered"
            name="skillsOffered"
            value={formData.skillsOffered}
            onChange={handleChange}
            placeholder="React, UI Design"
          />

          <label htmlFor="skillsWanted">Skills Wanted (comma separated)</label>
          <input
            id="skillsWanted"
            name="skillsWanted"
            value={formData.skillsWanted}
            onChange={handleChange}
            placeholder="Node.js, Public Speaking"
          />

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Creating account..." : "Signup"}
          </button>
        </form>

        {loading && <LoadingSpinner text="Creating your account..." />}

        <p className="switch-text">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </section>
  );
};

export default SignupPage;
