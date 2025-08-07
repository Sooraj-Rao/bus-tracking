"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useNotification } from "../../components/NotificationProvider/NotificationProvider";
import "./Schedules.css";
import { setAuthHeader } from "../../context/AuthContext";

const formatTime = (timestamp) => {
  if (!timestamp) return "N/A";
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatDuration = (minutes) => {
  if (!minutes) return "N/A";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

const Schedules = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showError } = useNotification();

  const userToken = localStorage.getItem("userToken");
  const adminToken = localStorage.getItem("adminToken");

  useEffect(() => {
    fetchBuses();
  }, []);

  const calculateArrivalTime = (startTimestamp, durationMinutes) => {
    if (!startTimestamp || !durationMinutes) return "N/A";
    const startDate = new Date(startTimestamp);
    const arrivalDate = new Date(
      startDate.getTime() + durationMinutes * 60 * 1000
    );
    return arrivalDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fetchBuses = async () => {
    try {
      setLoading(true);
      setAuthHeader(userToken || adminToken);
      const res = await axios.get("http://localhost:5000/api/bookings/user");
      setBuses(res.data.bookings);
    } catch (error) {
      console.error("Error fetching buses:", error);
      showError("Error", "Failed to fetch bus schedules");
    } finally {
      setLoading(false);
    }
  };

  const handleTrackBus = (data) => {
    navigate(`/track/bus/${data.busId._id}?bookingId=${data._id}`);
  };

  return (
    <div className="schedules-page">
      <div className="container">
        <div className="schedules-header">
          <h1 className="schedules-title">Bus Schedules</h1>
        </div>

        <div className="schedules-container">
          <div className="schedules-display">
            <h3 className="display-title">Schedules ({buses.length})</h3>

            {loading ? (
              <div className="loading">Loading schedules...</div>
            ) : buses.length === 0 ? (
              <div className="no-schedules">No schedules found</div>
            ) : (
              <div className="schedule-grids">
                {buses.map((schedule) => (
                  <div key={schedule._id} className="schedule-card">
                    <div className="schedule-header">
                      <div className="bus-info">
                        <div className="bus-number">
                          {schedule.busId.busNumber}
                        </div>
                        <div className="route-name">
                          {schedule.busId.routeName}
                        </div>
                      </div>
                    </div>

                    <div className="schedule-details">
                      <div className="detail-item">
                        <div className="detail-label">From</div>
                        <div className="detail-value">
                          {schedule.fromLocation.name}
                        </div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">To</div>
                        <div className="detail-value">
                          {schedule.toLocation.name}
                        </div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Departure</div>
                        <div className="detail-value">
                          {formatTime(
                            schedule.busId.routeWaypoints.find(
                              (wp) => wp.order === 0
                            )?.timestamp
                          )}
                        </div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Arrival</div>
                        <div className="detail-value">
                          {calculateArrivalTime(
                            schedule.busId.routeWaypoints.find(
                              (wp) => wp.order === 0
                            )?.timestamp,
                            schedule.estimatedDuration
                          )}
                        </div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Estimated Duration</div>
                        <div className="detail-value">
                          {formatDuration(schedule.estimatedDuration)}
                        </div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Distance</div>
                        <div className="detail-value">
                          {schedule.estimatedDistance} km
                        </div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Passengers</div>
                        <div className="detail-value">
                          {schedule.passengers || "N/A"}/50
                        </div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Contact</div>
                        <div className="detail-value">
                          {schedule.busId.contact}
                        </div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Status</div>
                        <div className="detail-value">
                          {schedule.bookingStatus}
                        </div>
                      </div>
                    </div>

                    <div className="schedule-actions">
                      <button
                        className="action-button track-btn"
                        onClick={() => handleTrackBus(schedule)}
                      >
                        📍 Track Live
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedules;
