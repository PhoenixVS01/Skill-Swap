import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <NavLink to="/" className="brand">
          SkillSwap
        </NavLink>

        <nav className="nav-links">
          <button type="button" className="theme-toggle" onClick={toggleTheme}>
            {isDarkMode ? "Light Mode" : "Dark Mode"}
          </button>
          {isAuthenticated ? (
            <>
              <span className="user-pill">Hi, {user?.name || "Learner"}</span>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `nav-btn ${isActive ? "nav-btn-active" : ""}`
                }
              >
                Dashboard
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="nav-btn nav-btn-ghost"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `nav-btn ${isActive ? "nav-btn-active" : ""}`
                }
              >
                Login
              </NavLink>
              <NavLink
                to="/signup"
                className={({ isActive }) =>
                  `nav-btn nav-btn-solid ${isActive ? "nav-btn-active" : ""}`
                }
              >
                Signup
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
