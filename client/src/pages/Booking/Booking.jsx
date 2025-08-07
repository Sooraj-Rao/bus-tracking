"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useNotification } from "../../components/NotificationProvider/NotificationProvider"
import { useAuth } from "../../context/AuthContext" 
import "./Booking.css"

const Booking = () => {
  const { user, isAuthenticated } = useAuth() 
  const [buses, setBuses] = useState([])
  const [selectedBus, setSelectedBus] = useState("")
  const [availableStops, setAvailableStops] = useState([]) 
  const [form, setForm] = useState({
    userName: user?.userName || "", 
    contact: "",
    email: user?.email || "",
    busId: "",
    fromLocation: "",
    toLocation: "",
  })
  const [userBookings, setUserBookings] = useState([]); 
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [routePreview, setRoutePreview] = useState(null)
  const { showSuccess, showError } = useNotification()

  useEffect(() => {
    fetchBuses()
    if (isAuthenticated && user?.id) {
      fetchUserBookings(user.id);
    }
  }, [isAuthenticated, user?.id]) 

  useEffect(() => {
    setForm((prevForm) => ({
      ...prevForm,
      userName: user?.userName || "",
      email: user?.email || "",
    }));
  }, [user]);


  useEffect(() => {
    if (selectedBus) {
      const bus = buses.find((b) => b._id === selectedBus)
      if (bus && bus.routeWaypoints && bus.routeWaypoints.length > 0) {
        const sortedWaypoints = [...bus.routeWaypoints].sort((a, b) => a.order - b.order)
        setAvailableStops(sortedWaypoints)
      } else {
        setAvailableStops([])
      }
    } else {
      setAvailableStops([])
    }
    setForm((prevForm) => ({
      ...prevForm,
      fromLocation: "",
      toLocation: "",
    }))
    setRoutePreview(null)
  }, [selectedBus, buses])

  useEffect(() => {
    if (form.fromLocation && form.toLocation && availableStops.length > 0) {
      calculateRoutePreview()
    } else {
      setRoutePreview(null)
    }
  }, [form.fromLocation, form.toLocation, availableStops])

  const fetchBuses = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/buses")
      setBuses(res.data)
    } catch (error) {
      console.error("Error fetching buses:", error)
      showError("Error", "Failed to load available buses")
    }
  }

  const fetchUserBookings = async (userId) => {
    try {
      const token = localStorage.getItem('userToken'); // Get user token
      const res = await axios.get(`http://localhost:5000/api/bookings/user/${userId}`, {
        headers: { 'x-auth-token': token }
      });
      setUserBookings(res.data.bookings);
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      showError("Error", "Failed to load your bookings.");
    }
  };

  const calculateRoutePreview = () => {
    const fromStop = availableStops.find((stop) => stop.name === form.fromLocation)
    const toStop = availableStops.find((stop) => stop.name === form.toLocation)

    if (fromStop && toStop) {
      const distance = calculateDistance(fromStop.lat, fromStop.lng, toStop.lat, toStop.lng)
      const estimatedTime = Math.round(distance * 3) 
      setRoutePreview({
        distance: distance.toFixed(1),
        estimatedTime: estimatedTime,
        fromStop,
        toStop,
      })
    }
  }

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const handleInputChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handleBusSelection = (busId) => {
    setSelectedBus(busId)
    setForm({
      ...form,
      busId: busId,
      fromLocation: "",
      toLocation: "", 
    })
    setRoutePreview(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isAuthenticated) {
      showError("Authentication Required", "Please log in to book a bus.");
      return;
    }

    if (!form.busId) {
      showError("Selection Required", "Please select a bus before booking")
      return
    }

    if (!form.fromLocation || !form.toLocation) {
      showError("Route Required", "Please select both FROM and TO locations")
      return
    }

    if (form.fromLocation === form.toLocation) {
      showError("Invalid Route", "FROM and TO locations cannot be the same")
      return
    }

    setLoading(true)

    try {
      const fromStop = availableStops.find((stop) => stop.name === form.fromLocation)
      const toStop = availableStops.find((stop) => stop.name === form.toLocation)

      const bookingData = {
        userName: form.userName,
        contact: form.contact,
        email: form.email,
        busId: form.busId,
        fromLocation: fromStop,
        toLocation: toStop,
        estimatedDistance: routePreview?.distance || 0,
        estimatedDuration: routePreview?.estimatedTime || 0,
      }

      const token = localStorage.getItem('userToken'); 
      const res = await axios.post("http://localhost:5000/api/bookings", bookingData, {
        headers: { 'x-auth-token': token }
      })

      const trackingLink = `${window.location.origin}/track/bus/${res.data.booking.busId}?bookingId=${res.data.booking._id}`

      setSuccess(
        <div>
          <p>
            <strong>🎉 Booking Confirmed Successfully!</strong>
          </p>
          <p>
            Your journey: {form.fromLocation} → {form.toLocation}
          </p>
          <p>Estimated time: {routePreview?.estimatedTime} minutes</p>
          <p>
            Track your bus here:{" "}
            <a href={trackingLink} target="_blank" rel="noopener noreferrer">
              {trackingLink}
            </a>
          </p>
        </div>,
      )

      showSuccess("Booking Confirmed!", "Check your email for tracking details")

      setForm({
        userName: user?.userName || "",
        contact: "",
        email: user?.email || "",
        busId: "",
        fromLocation: "",
        toLocation: "",
      })
      setSelectedBus("")
      setRoutePreview(null)
      if (isAuthenticated && user?.id) {
        fetchUserBookings(user.id); 
      }
    } catch (error) {
      console.error("Booking failed:", error)
      showError("Booking Failed", error.response?.data?.message || "Please try again")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="booking-page">
      <div className="container">
        <div className="booking-header">
          <h1 className="booking-tsitle">Book Your Bus</h1>
          <p className="booking-susbtitle">Select your route and book your journey</p>
        </div>

        <div className="booking-container">
          <div className="booking-form-section">
            <h2 className="form-title">Booking Details</h2>

            <form onSubmit={handleSubmit} className="booking-form">
              <div className="form-group">
                <label className="form-label">Select Bus Route</label>
                <select
                  name="busId"
                  className="form-select"
                  value={form.busId}
                  onChange={(e) => handleBusSelection(e.target.value)}
                  required
                >
                  <option value="">Choose a bus route</option>
                  {buses.map((bus) => (
                    <option key={bus._id} value={bus._id}>
                      {bus.busNumber} - {bus.routeName}
                    </option>
                  ))}
                </select>
              </div>

              {availableStops.length > 0 && (
                <>
                  <div className="form-group">
                    <label className="form-label">From Location</label>
                    <select
                      name="fromLocation"
                      className="form-select"
                      value={form.fromLocation}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Choose pickup location</option>
                      {availableStops.map((stop) => (
                        <option key={stop.name} value={stop.name}>
                          📍 {stop.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">To Location</label>
                    <select
                      name="toLocation"
                      className="form-select"
                      value={form.toLocation}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Choose destination</option>
                      {availableStops
                        .filter((stop) => stop.name !== form.fromLocation)
                        .map((stop) => (
                          <option key={stop.name} value={stop.name}>
                            🎯 {stop.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </>
              )}

              {routePreview && (
                <div className="route-preview">
                  <h4>📊 Journey Preview</h4>
                  <div className="preview-details">
                    <p>🚩 From: {routePreview.fromStop.name}</p>
                    <p>🏁 To: {routePreview.toStop.name}</p>
                    <p>📏 Distance: {routePreview.distance} km</p>
                    <p>⏱️ Estimated Time: {routePreview.estimatedTime} minutes</p>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="userName"
                  className="form-input"
                  placeholder="Enter your full name"
                  value={form.userName}
                  onChange={handleInputChange}
                  required
                  readOnly={isAuthenticated && user?.userName} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Number</label>
                <input
                  type="tel"
                  name="contact"
                  className="form-input"
                  placeholder="Enter your phone number"
                  value={form.contact}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="Enter your email address"
                  value={form.email}
                  onChange={handleInputChange}
                  required
                  readOnly={isAuthenticated && user?.email} 
                />
              </div>

              <button type="submit" className="submit-button" disabled={loading || !routePreview}>
                {loading ? "⏳ Processing..." : " Book Journey"}
              </button>
            </form>

            {success && <div className="success-message">{success}</div>}
          </div>

          <div className="bus-selection-section">
            <h2 className="available-buses-title">Available Routes</h2>

            {buses.length === 0 ? (
              <div className="loading">Loading available routes...</div>
            ) : (
              <div className="bus-options">
                {buses.map((bus) => (
                  <div
                    key={bus._id}
                    className={`bus-option ${selectedBus === bus._id ? "selected" : ""}`}
                    onClick={() => handleBusSelection(bus._id)}
                  >
                    <div className="bus-option-header">
                      <div className="bus-option-number">{bus.busNumber}</div>
                      <div className="bus-option-status">Available</div>
                    </div>
                    <div className="bus-option-details">
                      <div>
                        <strong>Route:</strong> {bus.routeName}
                      </div>
                      <div>
                        <strong>Contact:</strong> {bus.contact}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isAuthenticated && userBookings.length > 0 && (
              <div style={{ marginTop: '2rem', borderTop: '1px solid #e9ecef', paddingTop: '2rem' }}>
                <h3 className="available-buses-title">My Recent Bookings</h3>
                <div className="bus-options">
                  {userBookings.map((booking) => (
                    <div key={booking._id} className="bus-option">
                      <div className="bus-option-header">
                        <div className="bus-option-number">
                           {booking.busId?.busNumber || 'N/A'}
                        </div>
                        <div className="bus-option-status" style={{ background: '#e0f7fa', color: '#006064' }}>
                          {booking.bookingStatus}
                        </div>
                      </div>
                      <div className="bus-option-details">
                        <div>
                          <strong>Journey:</strong> {booking.fromLocation.name} → {booking.toLocation.name}
                        </div>
                        <div>
                          <strong>Booked On:</strong> {new Date(booking.createdAt).toLocaleDateString()}
                        </div>
                        <div>
                          <a
                            href={`${window.location.origin}/track/bus/${booking.busId?._id}?bookingId=${booking._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#3498db', textDecoration: 'underline' }}
                          >
                            Track This Journey
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Booking
