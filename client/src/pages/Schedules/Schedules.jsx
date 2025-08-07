"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useNotification } from "../../components/NotificationProvider/NotificationProvider";
import "./Schedules.css";

const Schedules = () => {
  const [buses, setBuses] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState("all");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useNotification();

  useEffect(() => {
    fetchBuses();
  }, []);

  useEffect(() => {
    filterSchedules();
  }, [buses, selectedRoute, selectedDate]); // Re-filter when buses, route, or date changes

  const fetchBuses = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/buses");
      setBuses(res.data);
    } catch (error) {
      console.error("Error fetching buses:", error);
      showError("Error", "Failed to fetch bus schedules");
    } finally {
      setLoading(false);
    }
  };

  const filterSchedules = () => {
    let schedulesToDisplay = buses; // Start with all buses as potential schedules

    if (selectedRoute !== "all") {
      schedulesToDisplay = schedulesToDisplay.filter(
        (bus) => bus.routeName === selectedRoute
      );
    }

    // For demonstration, we'll generate mock schedules based on available buses.
    // In a real app, you'd fetch actual schedules from a backend endpoint like /api/schedules?date=...&route=...
    const generatedSchedules = schedulesToDisplay.map((bus) => ({
      _id: bus._id, // Use bus ID as schedule ID for simplicity
      busId: bus._id,
      busNumber: bus.busNumber,
      busName: bus.busName,
      routeName: bus.routeName,
      contact: bus.contact,
      departureTime: "08:00", // Static for now, could be dynamic
      arrivalTime: "10:30", // Static for now, could be dynamic
      estimatedDelay: Math.random() > 0.7 ? Math.floor(Math.random() * 30) : 0, // Still simulated delay
      status: getRandomStatus(), // Still simulated status
      passengers: Math.floor(Math.random() * 50) + 10, // Still simulated passengers
    }));

    setFilteredSchedules(generatedSchedules);
  };

  const getRandomStatus = () => {
    const statuses = ["on-time", "delayed", "cancelled"];
    const weights = [0.7, 0.25, 0.05]; // 70% on-time, 25% delayed, 5% cancelled
    const random = Math.random();
    let sum = 0;

    for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
      if (random <= sum) return statuses[i];
    }
    return "on-time";
  };

  const handleTrackBus = (busId) => {
    navigate(`/track/bus/${busId}`);
  };


  const uniqueRoutes = [...new Set(buses.map((bus) => bus.routeName))];

  return (
    <div className="schedules-page">
      <div className="container">
        <div className="schedules-header">
          <h1 className="sschedules-title">Bus Schedules</h1>
        </div>

        <div className="schedules-contaisner">
       

          <div className="schedules-display">
            <h3 className="display-title">
              Schedules ({filteredSchedules.length})
            </h3>

            {loading ? (
              <div className="loading">Loading schedules...</div>
            ) : filteredSchedules.length === 0 ? (
              <div className="no-schedules">
                No schedules found for the selected criteria
              </div>
            ) : (
              <div className="schedule-grid">
                {filteredSchedules.map((schedule) => (
                  <div key={schedule._id} className="schedule-card">
                    <div className="schedule-header">
                      <div className="bus-info">
                        <div className="bus-number">
                          {schedule.busNumber}
                        </div>
                        <div className="route-name">{schedule.routeName}</div>
                      </div>
                    </div>

                    <div className="schedule-details">
                      <div className="detail-item">
                        <div className="detail-label">Departure</div>
                        <div className="detail-value">
                          {schedule.departureTime}
                        </div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Arrival</div>
                        <div className="detail-value">
                          {schedule.arrivalTime}
                        </div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Passengers</div>
                        <div className="detail-value">
                          {schedule.passengers}/50
                        </div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Contact</div>
                        <div className="detail-value">{schedule.contact}</div>
                      </div>
                    </div>

                    <div className="schedule-actions">
                      <button
                        className="action-button track-btn"
                        onClick={() => handleTrackBus(schedule._id)}
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
