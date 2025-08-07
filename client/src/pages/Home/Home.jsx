import React from "react";
import "./home.css";
import { useAuth } from "../../context/AuthContext";

const Footer = () => (
  <footer className="footer">
    <div className="footer-content">
      <div className="footer-section">
        <h3>BusTrack</h3>
        <p>Your go-to platform for bus booking and tracking.</p>
      </div>
      <div className="footer-section">
        <h3>Quick Links</h3>
        <ul>
          <li>
            <a href="#about" className="footer-link">
              About
            </a>
          </li>
          <li>
            <a href="#services" className="footer-link">
              Services
            </a>
          </li>
          <li>
            <a href="#contact" className="footer-link">
              Contact
            </a>
          </li>
        </ul>
      </div>
      <div className="footer-section">
        <h3>Contact Us</h3>
        <p>Email: support@bustrack.com</p>
        <p>Phone: +91 123-456-7890</p>
      </div>
    </div>
    <div className="footer-bottom">
      <p>&copy; 2025 BusTrack. All rights reserved.</p>
    </div>
  </footer>
);

const Home = () => {
  const { isAdmin, isAuthenticated } = useAuth();
  return (
    <div className="home-container">
      <main className="main">
        <section className="hero">
          <h2 className="hero-title">Track and Book Your Bus with Ease</h2>
          <p className="hero-text">
            BusTrack is your ultimate solution for seamless bus booking and
            real-time tracking
          </p>
          <div className="hero-buttons">
            <a
              href={
                isAdmin ? "/admin" : isAuthenticated ? "/booking" : "/login"
              }
              className="btn btn-primary"
            >
              Book Now
            </a>
            <a
              href={
                isAdmin ? "/admin" : isAuthenticated ? "/tracking" : "/login"
              }
              className="btn btn-secondary"
            >
              Track Your Bus
            </a>
          </div>
        </section>
        <section className="features">
          <h3 className="section-title">Why Choose BusTrack?</h3>
          <div className="features-grid">
            <div className="feature-card">
              <h4>Easy Booking</h4>
              <p>
                Book your bus in just a few clicks with our intuitive interface.
              </p>
            </div>
            <div className="feature-card">
              <h4>Real-Time Tracking</h4>
              <p>Monitor your bus's location using our tracking system.</p>
            </div>
            <div className="feature-card">
              <h4>Responsive Design</h4>
              <p>Work and Look great on both mobiles and PCs.</p>
            </div>
          </div>
        </section>
        <section className="cta">
          <h3 className="section-title">Ready to Get Started?</h3>
          <a
            href={isAdmin ? "/admin" : isAuthenticated ? "/booking" : "/login"}
            className="btn btn-primary"
          >
            Start Now
          </a>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Home;
