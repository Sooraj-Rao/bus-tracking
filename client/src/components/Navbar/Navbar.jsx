"use client";

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // Import useAuth
import "./Navbar.css";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin, isAuthenticated, logout } = useAuth(); // Get auth state and logout function

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          BusTracker Pro
        </Link>

        <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
          ☰
        </button>

        <ul className={`navbar-nav ${isMobileMenuOpen ? "mobile-open" : ""}`}>
          <li>
            <Link
              to="/"
              className={`nav-link ${isActive("/") ? "active" : ""}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
          </li>
          {!isAdmin && isAuthenticated && (
            <>
              <li>
                <Link
                  to="/tracking"
                  className={`nav-link ${
                    isActive("/tracking") ? "active" : ""
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Live Tracking
                </Link>
              </li>
              <li>
                <Link
                  to="/booking"
                  className={`nav-link ${isActive("/booking") ? "active" : ""}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Book Bus
                </Link>
              </li>
              <li>
                <Link
                  to="/schedules"
                  className={`nav-link ${
                    isActive("/schedules") ? "active" : ""
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Schedules
                </Link>
              </li>
              {/* <li>
                <Link
                  to="/route-optimization"
                  className={`nav-link ${
                    isActive("/route-optimization") ? "active" : ""
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Route Optimizer
                </Link>
              </li> */}
            </>
          )}
          {isAdmin && ( // Only show Admin link if admin is logged in
            <li>
              <Link
                to="/admin"
                className={`nav-link ${
                  isActive("/admin") || isActive("/admin/login") ? "active" : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Admin
              </Link>
            </li>
          )}

          {isAuthenticated ? (
            <li>
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="nav-link"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "white",
                }}
              >
                Logout ({user?.userName || (isAdmin ? "Admin" : "User")})
              </button>
            </li>
          ) : (
            <>
              <li>
                <Link
                  to="/login"
                  className={`nav-link ${isActive("/login") ? "active" : ""}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className={`nav-link ${
                    isActive("/register") ? "active" : ""
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
