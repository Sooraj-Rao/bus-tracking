"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { useNotification } from "../../components/NotificationProvider/NotificationProvider"
import { useAuth } from "../../context/AuthContext" // Import useAuth
import "./Auth.css" // Reusing Auth.css for both login/register

const RegisterPage = () => {
  const [form, setForm] = useState({
    userName: "",
    email: "",
    password: "",
  })
  const [otp, setOtp] = useState("")
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { showSuccess, showError } = useNotification()
  const { login } = useAuth() // Get login function from AuthContext

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleOtpChange = (e) => {
    setOtp(e.target.value)
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.post("http://localhost:5000/api/auth/register", form)
      showSuccess("OTP Sent!", "A verification code has been sent to your email.")
      setShowOtpInput(true)
    } catch (error) {
      console.error("Registration failed:", error)
      showError("Registration Failed", error.response?.data?.message || "Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleOtpVerify = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.post("http://localhost:5000/api/auth/verify-otp", { ...form, otp })
      login(res.data.token, res.data.user); // Use AuthContext login function
      showSuccess("Success!", "Account created and verified. You can now log in.")
      navigate("/login")
    } catch (error) {
      console.error("OTP verification failed:", error)
      showError("Verification Failed", error.response?.data?.message || "Invalid or expired OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-card">
          <h2 className="auth-title">Register Account</h2>
          {!showOtpInput ? (
            <form onSubmit={handleRegisterSubmit} className="auth-form">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="userName"
                  className="form-input"
                  placeholder="Your Name"
                  value={form.userName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="your@example.com"
                  value={form.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                />
              </div>
              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? "Sending OTP..." : "Register & Get OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpVerify} className="auth-form">
              <p className="otp-info">Enter the 6-digit OTP sent to {form.email}</p>
              <div className="form-group">
                <label className="form-label">OTP</label>
                <input
                  type="text"
                  name="otp"
                  className="form-input"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={handleOtpChange}
                  required
                  maxLength={6}
                />
              </div>
              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP & Register"}
              </button>
              <button
                type="button"
                className="auth-button secondary"
                onClick={() => setShowOtpInput(false)}
                disabled={loading}
              >
                Back to Registration
              </button>
            </form>
          )}
          <p className="auth-link-text">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
