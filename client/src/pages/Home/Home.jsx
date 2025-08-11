import React, { useEffect, useState } from "react";
import "./home.css";
import { useAuth } from "../../context/AuthContext";

const Home = () => {
  const { isAdmin, isAuthenticated, user } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState({
    loading: false,
    success: null,
    error: null,
  });
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, success: null, error: null });

    try {
      const res = await fetch("http://localhost:5000/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus({
          loading: false,
          success: "Message sent successfully!",
          error: null,
        });
        setFormData({ name: "", email: "", message: "" });
      } else {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to send message");
      }
    } catch (err) {
      setStatus({ loading: false, success: null, error: err.message });
    }
  };

  useEffect(() => {
    if (user) {
      setFormData({ ...formData, email: user.email });
    }
  }, [user]);

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

        <section id="about" className="about-section">
          <h3 className="section-title">About Us</h3>
          <p className="section-text">
            BusTrack is designed to simplify your travel experience. We bring
            together easy booking, reliable tracking, and excellent customer
            support so you can focus on enjoying your journey.
          </p>
        </section>

        <section id="services" className="services-section">
          <h3 className="section-title">Our Services</h3>
          <div className="services-grid">
            <div className="service-card">
              <h4>Easy Booking</h4>
              <p>
                Book your bus in just a few clicks with our intuitive interface.
              </p>
            </div>
            <div className="service-card">
              <h4>Real-Time Tracking</h4>
              <p>Monitor your bus's location using our live tracking system.</p>
            </div>
            <div className="service-card">
              <h4>24/7 Customer Support</h4>
              <p>
                We're here to assist you anytime during your travel journey.
              </p>
            </div>
          </div>
        </section>

        <section id="contact" className="contact-section">
          <h3 className="section-title">Contact Us</h3>
          <form className="contact-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <textarea
              name="message"
              placeholder="Your Message"
              value={formData.message}
              onChange={handleChange}
              required
            ></textarea>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={status.loading}
            >
              {status.loading ? "Sending..." : "Send Message"}
            </button>
            {status.success && (
              <p className="success-message">{status.success}</p>
            )}
            {status.error && <p className="error-message">{status.error}</p>}
          </form>
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
    </div>
  );
};

export default Home;
