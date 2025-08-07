"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { useNotification } from "../../components/NotificationProvider/NotificationProvider"
import { useAuth } from "../../context/AuthContext" // Import useAuth
import "./Auth.css"

const LoginPage = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { showSuccess, showError } = useNotification()
  const { login } = useAuth() // Get login function from AuthContext

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", form)
      login(res.data.token, res.data.user); // Use AuthContext login function
      showSuccess("Login Successful!", `Welcome back, ${res.data.user.userName || res.data.user.email}!`)
      navigate("/") // Redirect to home or dashboard
    } catch (error) {
      console.error("Login failed:", error)
      showError("Login Failed", error.response?.data?.message || "Invalid email or password.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-card">
          <h2 className="auth-title">Login to Your Account</h2>
          <form onSubmit={handleLoginSubmit} className="auth-form">
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
                placeholder="Your password"
                value={form.password}
                onChange={handleInputChange}
                required
              />
            </div>
            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? "Logging In..." : "Login"}
            </button>
          </form>
          <p className="auth-link-text">
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
