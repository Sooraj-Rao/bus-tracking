"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useNotification } from "../../components/NotificationProvider/NotificationProvider"
import "./RouteOptimization.css"

const RouteOptimization = () => {
  const [buses, setBuses] = useState([])
  const [optimizationParams, setOptimizationParams] = useState({
    startLocation: "",
    endLocation: "",
    selectedRoute: "all",
    optimizationGoal: "time",
    trafficCondition: "normal",
  })
  const [optimizationResults, setOptimizationResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const { showSuccess, showError, showInfo } = useNotification()

  useEffect(() => {
    fetchBuses()
  }, [])

  const fetchBuses = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/buses")
      setBuses(res.data)
    } catch (error) {
      console.error("Error fetching buses:", error)
      showError("Error", "Failed to fetch bus data")
    }
  }

  const handleInputChange = (e) => {
    setOptimizationParams({
      ...optimizationParams,
      [e.target.name]: e.target.value,
    })
  }

  const handleOptimize = async (e) => {
    e.preventDefault()

    if (!optimizationParams.startLocation || !optimizationParams.endLocation) {
      showError("Missing Information", "Please provide both start and end locations")
      return
    }

    setLoading(true)
    showInfo("Processing", "Analyzing traffic patterns and optimizing routes...")

    try {
      const res = await axios.post("http://localhost:5000/api/optimization/optimize", optimizationParams);
      setOptimizationResults(res.data);
      showSuccess("Optimization Complete!", "Route suggestions generated successfully");
    } catch (error) {
      console.error("Error optimizing routes:", error);
      showError("Optimization Failed", error.response?.data?.message || "Failed to optimize routes. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const uniqueRoutes = [...new Set(buses.map((bus) => bus.routeName))]

  return (
    <div className="route-optimization-page">
      <div className="container">
        <div className="optimization-header">
          <h1 className="optimization-title">Route Optimization</h1>
          <p className="optimization-subtitle">AI-powered route optimization for efficient bus operations</p>
        </div>

        <div className="optimization-container">
          <div className="optimization-controls">
            <h3 className="controls-title">⚙️ Optimization Parameters</h3>

            <form onSubmit={handleOptimize} className="optimization-form">
              <div className="form-group">
                <label className="form-label">Start Location</label>
                <input
                  type="text"
                  name="startLocation"
                  className="form-input"
                  placeholder="Enter starting point"
                  value={optimizationParams.startLocation}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Location</label>
                <input
                  type="text"
                  name="endLocation"
                  className="form-input"
                  placeholder="Enter destination"
                  value={optimizationParams.endLocation}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Route to Optimize</label>
                <select
                  name="selectedRoute"
                  className="form-select"
                  value={optimizationParams.selectedRoute}
                  onChange={handleInputChange}
                >
                  <option value="all">All Routes</option>
                  {uniqueRoutes.map((route) => (
                    <option key={route} value={route}>
                      {route}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Optimization Goal</label>
                <select
                  name="optimizationGoal"
                  className="form-select"
                  value={optimizationParams.optimizationGoal}
                  onChange={handleInputChange}
                >
                  <option value="time">Minimize Travel Time</option>
                  <option value="fuel">Minimize Fuel Consumption</option>
                  <option value="distance">Minimize Distance</option>
                  <option value="comfort">Maximize Passenger Comfort</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Traffic Condition</label>
                <select
                  name="trafficCondition"
                  className="form-select"
                  value={optimizationParams.trafficCondition}
                  onChange={handleInputChange}
                >
                  <option value="light">Light Traffic</option>
                  <option value="normal">Normal Traffic</option>
                  <option value="heavy">Heavy Traffic</option>
                </select>
              </div>

              <button type="submit" className="optimize-button" disabled={loading}>
                {loading ? "🔄 Optimizing..." : "🚀 Optimize Routes"}
              </button>
            </form>
          </div>

          <div className="optimization-results">
            <h3 className="results-title">📊 Optimization Results</h3>

            {loading ? (
              <div className="loading-optimization">
                <p>🤖 AI is analyzing traffic patterns...</p>
                <p>⏳ Processing route alternatives...</p>
                <p>📈 Calculating efficiency metrics...</p>
              </div>
            ) : optimizationResults ? (
              <>
                <div className="optimization-metrics">
                  <div className="metric-card">
                    <span className="metric-value">{optimizationResults.metrics.timeSaved}</span>
                    <div className="metric-label">Minutes Saved</div>
                  </div>
                  <div className="metric-card">
                    <span className="metric-value">{optimizationResults.metrics.fuelSaved}L</span>
                    <div className="metric-label">Fuel Saved</div>
                  </div>
                  <div className="metric-card">
                    <span className="metric-value">{optimizationResults.metrics.distanceOptimized}km</span>
                    <div className="metric-label">Optimized Distance</div>
                  </div>
                  <div className="metric-card">
                    <span className="metric-value">{optimizationResults.metrics.efficiencyGain}%</span>
                    <div className="metric-label">Efficiency Gain</div>
                  </div>
                </div>

                <div className="route-suggestions">
                  <h4 className="suggestions-title">🎯 Route Suggestions</h4>
                  {optimizationResults.suggestions.map((suggestion, index) => (
                    <div key={index} className="suggestion-card">
                      <div className="suggestion-header">
                        <div className="suggestion-title">{suggestion.title}</div>
                        <div className="suggestion-score">Score: {suggestion.score}/100</div>
                      </div>
                      <div className="suggestion-details">{suggestion.details}</div>
                      <div className="suggestion-benefits">
                        <div className="benefits-title">✅ Benefits:</div>
                        {suggestion.benefits.map((benefit, idx) => (
                          <div key={idx} className="benefit-item">
                            <span>•</span>
                            <span>{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="no-results">
                <p>🔍 Enter optimization parameters and click "Optimize Routes" to see AI-powered suggestions</p>
                <p>Our system will analyze:</p>
                <ul style={{ textAlign: "left", marginTop: "1rem" }}>
                  <li>• Real-time traffic conditions</li>
                  <li>• Historical route performance</li>
                  <li>• Fuel efficiency patterns</li>
                  <li>• Passenger demand data</li>
                  <li>• Weather and road conditions</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RouteOptimization
