"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { useNotification } from "../../components/NotificationProvider/NotificationProvider"
import { useAuth } from "../../context/AuthContext" 
import "../Auth/Auth.css" 

const AdminLoginPage = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { showSuccess, showError } = useNotification()
  const { login } = useAuth() 

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.post("http://localhost:5000/api/admin/auth/login", form)
      login(res.data.token, null, true); 
      showSuccess("Admin Login Successful!", "Welcome to the Admin Panel!")
      navigate("/admin")
    } catch (error) {
      console.error("Admin login failed:", error)
      showError("Login Failed", error.response?.data?.message || "Invalid admin credentials.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-card">
          <h2 className="auth-title">Admin Login</h2>
          <form onSubmit={handleLoginSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Admin Email</label>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="admin@example.com"
                value={form.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Admin Password</label>
              <input
                type="password"
                name="password"
                className="form-input"
                placeholder="Your admin password"
                value={form.password}
                onChange={handleInputChange}
                required
              />
            </div>
            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? "Logging In..." : "Login as Admin"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AdminLoginPage
