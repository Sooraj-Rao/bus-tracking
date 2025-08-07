"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import MapComponent from "../../components/MapComponent/MapComponent";
import { useNotification } from "../../components/NotificationProvider/NotificationProvider";
import "./Tracking.css";

const Tracking = () => {
  const [buses, setBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoute, setSelectedRoute] = useState("all");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showInfo, showError } = useNotification();

  useEffect(() => {
    fetchBuses();
  }, []);

  useEffect(() => {
    filterBuses();
  }, [buses, searchTerm, selectedRoute]);

  const fetchBuses = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/buses");
      setBuses(res.data);
    } catch (error) {
      console.error("Error fetching buses:", error);
      showError("Error", "Failed to fetch bus data");
    } finally {
      setLoading(false);
    }
  };

  const filterBuses = () => {
    let filtered = buses;

    if (selectedRoute !== "all") {
      filtered = filtered.filter((bus) => bus.routeName === selectedRoute);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (bus) =>
          bus.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bus.busName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bus.routeName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredBuses(filtered);
  };

  const handleTrackBus = (busId) => {
    navigate(`/track/bus/${busId}`);
  };

  const uniqueRoutes = [...new Set(buses.map((bus) => bus.routeName))];

  return (
    <div className="tracking-page">
      <div className="container">
        <div className="tracking-header">
          <h1 className="tracking-titles">Live Bus Tracking</h1>
          <p className="tracking-subtistle">
            Track all buses in real-time and get live location updates
          </p>
        </div>

        <MapComponent title="Live Bus Tracking Map" />

        <div className="bus-list">
          <h3 className="bus-list-title">
            Available Buses ({filteredBuses.length})
          </h3>

          {loading ? (
            <div className="no-buses">Loading buses...</div>
          ) : filteredBuses.length === 0 ? (
            <div className="no-buses">
              No buses found matching your criteria
            </div>
          ) : (
            <div className="bus-grid">
              {filteredBuses.map((bus) => (
                <div key={bus._id} className="bus-card">
                  <div className="bus-card-header">
                    <div className="bus-number">{bus.busNumber}</div>
                    <div className="bus-status active">Active</div>
                  </div>

                  <div className="bus-infso" style={{fontWeight:'10px'}}>
                    <div>
                      <strong>Name:</strong> {bus.busName}
                    </div>
                    <div>
                      <strong>Route:</strong> {bus.routeName}
                    </div>
                    <div>
                      <strong>Contact:</strong> {bus.contact}
                    </div>

                    <div>
                      <strong>Last Updated:</strong>{" "}
                      {new Date(bus.currentLocation.timestamp).toLocaleString()}
                    </div>
                  </div>

                  <button
                    className="track-button"
                    onClick={() => handleTrackBus(bus._id)}
                  >
                    📍 Track This Bus
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tracking;
