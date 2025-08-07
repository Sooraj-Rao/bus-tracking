"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import { useNotification } from "../../components/NotificationProvider/NotificationProvider";
import "leaflet/dist/leaflet.css";
import "./SingleBusTracking.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

const startIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#27ae60" width="24" height="24">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `),
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

const endIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#e74c3c" width="24" height="24">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `),
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

const SingleBusTracking = () => {
  const { busId } = useParams();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  const [bus, setBus] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTracking, setIsTracking] = useState(true);
  const [routeHistory, setRouteHistory] = useState([]);
  const { showSuccess, showError, showInfo } = useNotification();

  useEffect(() => {
    fetchData();
  }, [busId, bookingId]);

  useEffect(() => {
    let interval;
    if (isTracking && bus) {
      interval = setInterval(fetchBusData, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, busId, bus]);

  const fetchData = async () => {
    try {
      const busRes = await axios.get(
        `http://localhost:5000/api/buses/${busId}`
      );
      setBus(busRes.data);

      if (bookingId) {
        const bookingRes = await axios.get(
          `http://localhost:5000/api/bookings/${bookingId}`
        );
        setBooking(bookingRes.data.booking);
      }

      if (busRes.data.route && busRes.data.route.length > 0) {
        setRouteHistory(busRes.data.route.slice(-10));
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again.");
      showError("Error", "Failed to fetch tracking data");
    } finally {
      setLoading(false);
    }
  };

  const fetchBusData = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/buses/${busId}`);
      const busData = res.data;

      setBus(busData);

      if (busData.route && busData.route.length > 0) {
        setRouteHistory(busData.route.slice(-10));
      }
    } catch (err) {
      console.error("Error fetching bus data:", err);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchData();
    showInfo("Refreshing", "Updating tracking data...");
  };

  const handleToggleTracking = () => {
    setIsTracking(!isTracking);
    if (!isTracking) {
      showSuccess("Tracking Resumed", "Live tracking is now active");
    } else {
      showInfo("Tracking Paused", "Live tracking has been paused");
    }
  };

  const calculateProgress = () => {
    if (!bus || !bus.routeWaypoints || bus.routeWaypoints.length < 2) return 0;

    if (booking && booking.fromLocation && booking.toLocation) {
      const fromStop = booking.fromLocation;
      const toStop = booking.toLocation;

      const fromIndex = bus.routeWaypoints.findIndex(
        (wp) => wp.name === fromStop.name
      );
      const toIndex = bus.routeWaypoints.findIndex(
        (wp) => wp.name === toStop.name
      );

      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return 0;

      const relevantWaypoints = bus.routeWaypoints.slice(
        Math.min(fromIndex, toIndex),
        Math.max(fromIndex, toIndex) + 1
      );

      const totalBookingDistance =
        calculateDistanceBetweenWaypoints(relevantWaypoints);
      if (totalBookingDistance === 0) return 0;

      let closestPointOnRoute = null;
      let minDistanceToRoute = Infinity;
      let progressAlongBookingRoute = 0;

      for (let i = 0; i < relevantWaypoints.length - 1; i++) {
        const p1 = relevantWaypoints[i];
        const p2 = relevantWaypoints[i + 1];

        const segmentLengthSq = (p2.lat - p1.lat) ** 2 + (p2.lng - p1.lng) ** 2;
        if (segmentLengthSq === 0) continue;

        const t =
          ((bus.currentLocation.lat - p1.lat) * (p2.lat - p1.lat) +
            (bus.currentLocation.lng - p1.lng) * (p2.lng - p1.lng)) /
          segmentLengthSq;
        const clampedT = Math.max(0, Math.min(1, t));

        const projectedLat = p1.lat + clampedT * (p2.lat - p1.lat);
        const projectedLng = p1.lng + clampedT * (p2.lng - p1.lng);

        const distToProjected = calculateDistance(
          bus.currentLocation.lat,
          bus.currentLocation.lng,
          projectedLat,
          projectedLng
        );

        if (distToProjected < minDistanceToRoute) {
          minDistanceToRoute = distToProjected;
          closestPointOnRoute = { lat: projectedLat, lng: projectedLng };

          let distToProjectedFromBookingStart = 0;
          for (let j = 0; j < i; j++) {
            distToProjectedFromBookingStart += calculateDistance(
              relevantWaypoints[j].lat,
              relevantWaypoints[j].lng,
              relevantWaypoints[j + 1].lat,
              relevantWaypoints[j + 1].lng
            );
          }
          distToProjectedFromBookingStart += calculateDistance(
            p1.lat,
            p1.lng,
            projectedLat,
            projectedLng
          );
          progressAlongBookingRoute =
            (distToProjectedFromBookingStart / totalBookingDistance) * 100;
        }
      }
      return Math.round(progressAlongBookingRoute);
    } else {
      return Math.round((bus.routeProgress || 0) * 100);
    }
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateDistanceBetweenWaypoints = (waypoints) => {
    let total = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      total += calculateDistance(
        waypoints[i].lat,
        waypoints[i].lng,
        waypoints[i + 1].lat,
        waypoints[i + 1].lng
      );
    }
    return total;
  };

  if (loading && !bus) {
    return (
      <div className="single-bus-tracking">
        <div className="container">
          <div className="loading-message">
            <h2>🔍 Loading tracking data...</h2>
            <p>Please wait while we fetch the latest information</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !bus) {
    return (
      <div className="single-bus-tracking">
        <div className="container">
          <div className="error-message">
            <h2>❌ Error Loading Tracking Data</h2>
            <p>{error}</p>
            <button
              onClick={handleRefresh}
              className="control-button refresh-button"
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!bus) {
    return (
      <div className="single-bus-tracking">
        <div className="container">
          <div className="error-message">
            <h2>Bus Not Found</h2>
            <p>The requested bus could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  let routeCoordinates = [];
  let startPoint = null;
  let endPoint = null;

  if (booking && booking.fromLocation && booking.toLocation) {
    startPoint = booking.fromLocation;
    endPoint = booking.toLocation;
    const fromIndex = bus.routeWaypoints.findIndex(
      (wp) => wp.name === startPoint.name
    );
    const toIndex = bus.routeWaypoints.findIndex(
      (wp) => wp.name === endPoint.name
    );

    if (fromIndex !== -1 && toIndex !== -1) {
      const orderedWaypoints = [...bus.routeWaypoints].sort(
        (a, b) => a.order - b.order
      );
      const startIndex = orderedWaypoints.findIndex(
        (wp) => wp.name === startPoint.name
      );
      const endIndex = orderedWaypoints.findIndex(
        (wp) => wp.name === endPoint.name
      );

      if (startIndex !== -1 && endIndex !== -1) {
        if (startIndex < endIndex) {
          routeCoordinates = orderedWaypoints
            .slice(startIndex, endIndex + 1)
            .map((point) => [point.lat, point.lng]);
        } else {
          routeCoordinates = orderedWaypoints
            .slice(endIndex, startIndex + 1)
            .reverse()
            .map((point) => [point.lat, point.lng]);
        }
      }
    } else {
      routeCoordinates = [
        [booking.fromLocation.lat, booking.fromLocation.lng],
        [booking.toLocation.lat, booking.toLocation.lng],
      ];
    }
  } else {
    const routeWaypoints = bus.routeWaypoints || [];
    routeCoordinates = routeWaypoints.map((point) => [point.lat, point.lng]);
    startPoint = bus.startPoint;
    endPoint = bus.endPoint;
  }

  const recentPath = routeHistory.map((point) => [point.lat, point.lng]);
  const progress = calculateProgress();

  return (
    <div className="single-bus-tracking">
      <div className="container">
        <div className="tracking-header">
          <h1 className="trsacking-title">
            Tracking Bus{" "}
            <span className="bus-number-highlight">{bus.busNumber}</span>
          </h1>
          {booking ? (
            <p className="tracsking-subtitle">
              Your Journey: {booking.fromLocation.name} →{" "}
              {booking.toLocation.name}
            </p>
          ) : (
            <p className="stracking-subtitle">
              Live location updates • Route: {bus.routeName}
            </p>
          )}
        </div>

        <div className="tracking-container">
          <div className="bus-info-panel">
            <h3 className="info-title">Journey Information</h3>

            <div className="bus-details">
              <div className="detail-row">
                <span className="detail-label">Bus Number</span>
                <span className="detail-value">{bus.busNumber}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Bus Name</span>
                <span className="detail-value">{bus.busName}</span>
              </div>

              {booking && (
                <>
                  <div className="detail-row">
                    <span className="detail-label">From</span>
                    <span className="detail-value">
                      {booking.fromLocation.name}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">To</span>
                    <span className="detail-value">
                      {booking.toLocation.name}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Distance</span>
                    <span className="detail-value">
                      {booking.estimatedDistance} km
                    </span>
                  </div>
                </>
              )}

              <div className="detail-row">
                <span className="detail-label">Contact</span>
                <span className="detail-value">{bus.contact}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Last Updated</span>
                <span className="detail-value">
                  {new Date(bus.currentLocation.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="map-section">
            <div className="map-header">
              <h3 className="map-title">
                🗺️ {booking ? "Your Journey Route" : "Live Location Map"}
              </h3>
              <div className="last-updated">
                Last updated:{" "}
                {new Date(bus.currentLocation.timestamp).toLocaleTimeString()}
                {isTracking && (
                  <span style={{  marginLeft: "10px" }}>
                    ● Auto-updating
                  </span>
                )}
              </div>
            </div>

            <MapContainer
              center={[bus.currentLocation.lat, bus.currentLocation.lng]}
              zoom={13}
              className="leaflet-container"
              key={`${bus.currentLocation.lat}-${bus.currentLocation.lng}`}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              />

              {routeCoordinates.length > 1 && (
                <Polyline
                  positions={routeCoordinates}
                  color="#3498db"
                  weight={4}
                  opacity={0.8}
                />
              )}

              {recentPath.length > 1 && (
                <Polyline
                  positions={recentPath}
                  color="#27ae60"
                  weight={3}
                  opacity={0.9}
                />
              )}

              {startPoint && (
                <Marker
                  position={[startPoint.lat, startPoint.lng]}
                  icon={startIcon}
                >
                  <Popup>
                    <div style={{ textAlign: "center" }}>
                      <strong>
                        🚩 {booking ? "Your Pickup" : "Start"}:{" "}
                        {startPoint.name}
                      </strong>
                      <br />
                      {booking
                        ? "Journey starts here"
                        : `Route: ${bus.routeName}`}
                    </div>
                  </Popup>
                </Marker>
              )}

              {endPoint && (
                <Marker position={[endPoint.lat, endPoint.lng]} icon={endIcon}>
                  <Popup>
                    <div style={{ textAlign: "center" }}>
                      <strong>
                        🏁 {booking ? "Your Destination" : "End"}:{" "}
                        {endPoint.name}
                      </strong>
                      <br />
                      {booking
                        ? "Journey ends here"
                        : `Route: ${bus.routeName}`}
                    </div>
                  </Popup>
                </Marker>
              )}

              <Marker
                position={[bus.currentLocation.lat, bus.currentLocation.lng]}
              >
                <Popup>
                  <div style={{ textAlign: "center" }}>
                    <strong>{bus.busNumber}</strong>
                    <br />
                    <div style={{ margin: "0.5rem 0" }}>
                      {booking ? (
                        <>
                          Journey: {booking.fromLocation.name} →{" "}
                          {booking.toLocation.name}
                          <br />
                          Progress: {progress}%
                        </>
                      ) : (
                        <>
                          Route: {bus.routeName}
                          <br />
                          Progress: {progress}%
                        </>
                      )}
                      <br />
                      Contact: {bus.contact}
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#666" }}>
                      Location: {bus.currentLocation.lat.toFixed(4)},{" "}
                      {bus.currentLocation.lng.toFixed(4)}
                      <br />
                      Updated:{" "}
                      {new Date(
                        bus.currentLocation.timestamp
                      ).toLocaleTimeString()}
                    </div>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleBusTracking;
