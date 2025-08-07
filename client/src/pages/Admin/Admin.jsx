"use client";

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useNotification } from "../../components/NotificationProvider/NotificationProvider";
import { useAuth } from "../../context/AuthContext";
import "./Admin.css";
import AdminLoginPage from "./AdminLoginPage";

const debounce = (func, delay) => {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
};

const Admin = () => {
  const { isAdmin, loading: authLoading, setAuthHeader } = useAuth();
  const [activeTab, setActiveTab] = useState("add-bus");
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [busForm, setBusForm] = useState({
    busNumber: "",
    busName: "",
    routeName: "",
    contact: "",
  });
  const [routeForm, setRouteForm] = useState({
    routeName: "",
    waypoints: [{ name: "", lat: "", lng: "" }],
  });
  const [loading, setLoading] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [editingRoute, setEditingRoute] = useState(null);
  const [waypointSuggestions, setWaypointSuggestions] = useState({});

  const { showSuccess, showError, showInfo } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading) {
      if (!isAdmin) {
        navigate("/admin/login", { replace: true });
      } else {
        const adminToken = localStorage.getItem("adminToken");
        setAuthHeader(adminToken);
        fetchData();
      }
    }
  }, [isAdmin, authLoading, navigate, setAuthHeader]);

  const fetchData = () => {
    fetchBuses();
    fetchRoutes();
  };

  const fetchBuses = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/buses");
      setBuses(res.data);
    } catch (error) {
      console.error("Error fetching buses:", error);
      showError("Error", "Failed to fetch bus data. Please log in again.");
    }
  };

  const fetchRoutes = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/routes");
      setRoutes(res.data);
    } catch (error) {
      console.error("Error fetching routes:", error);
      showError("Error", "Failed to fetch route data. Please log in again.");
    }
  };

  const handleBusFormChange = (e) => {
    setBusForm({
      ...busForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleRouteFormChange = (e) => {
    setRouteForm({
      ...routeForm,
      [e.target.name]: e.target.value,
    });
  };

  const fetchSuggestions = useCallback(async (index, query) => {
    if (query.length < 2) {
      setWaypointSuggestions((prev) => ({ ...prev, [index]: [] }));
      return;
    }
    try {
      const res = await axios.get(
        `http://localhost:5000/api/geocoding/geocode?address=${encodeURIComponent(
          query
        )}`
      );
      setWaypointSuggestions((prev) => ({ ...prev, [index]: res.data }));
    } catch (error) {
      console.error("Geocoding suggestions error:", error);
      setWaypointSuggestions((prev) => ({ ...prev, [index]: [] }));
    }
  }, []);

  const debouncedFetchSuggestions = useCallback(
    debounce(fetchSuggestions, 500),
    [fetchSuggestions]
  );

  const handleWaypointChange = (index, e) => {
    const { name, value } = e.target;
    const newWaypoints = [...routeForm.waypoints];
    newWaypoints[index][name] = value;
    setRouteForm({ ...routeForm, waypoints: newWaypoints });

    if (name === "name") {
      debouncedFetchSuggestions(index, value);
    }
  };

  const addWaypoint = () => {
    setRouteForm({
      ...routeForm,
      waypoints: [...routeForm.waypoints, { name: "", lat: "", lng: "" }],
    });
    setWaypointSuggestions((prev) => ({
      ...prev,
      [routeForm.waypoints.length]: [],
    })); 
  };

  const removeWaypoint = (index) => {
    const newWaypoints = routeForm.waypoints.filter((_, i) => i !== index);
    setRouteForm({ ...routeForm, waypoints: newWaypoints });
    setWaypointSuggestions((prev) => {
      const newSuggestions = { ...prev };
      delete newSuggestions[index];
      const reindexedSuggestions = {};
      Object.keys(newSuggestions).forEach((key, i) => {
        if (parseInt(key) > index) {
          reindexedSuggestions[parseInt(key) - 1] = newSuggestions[key];
        } else {
          reindexedSuggestions[key] = newSuggestions[key];
        }
      });
      return reindexedSuggestions;
    });
  };


  const handleSelectSuggestion = (index, suggestion) => {
    const newWaypoints = [...routeForm.waypoints];
    newWaypoints[index].name = suggestion.address;
    newWaypoints[index].lat = parseFloat(suggestion.lat).toFixed(6);
    newWaypoints[index].lng = parseFloat(suggestion.lng).toFixed(6);
    setRouteForm({ ...routeForm, waypoints: newWaypoints });
    setWaypointSuggestions((prev) => ({ ...prev, [index]: [] })); 
  };

  const handleAddBus = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const busData = {
        busNumber: busForm.busNumber,
        busName: busForm.busName,
        routeName: busForm.routeName,
        contact: busForm.contact,
      };

      await axios.post("http://localhost:5000/api/buses", busData);

      showSuccess("Success!", `Bus ${busForm.busNumber} added successfully`);

      setBusForm({
        busNumber: "",
        busName: "",
        routeName: "",
        contact: "",
      });

      fetchBuses();
    } catch (error) {
      console.error("Error adding bus:", error);
      showError(
        "Error",
        error.response?.data?.message || "Failed to add bus. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditBus = (bus) => {
    setEditingBus(bus);
    setBusForm({
      busNumber: bus.busNumber,
      busName: bus.busName,
      routeName: bus.routeName,
      contact: bus.contact,
    });
    setActiveTab("add-bus"); 
  };

  const handleUpdateBus = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const busData = {
        busNumber: busForm.busNumber,
        busName: busForm.busName,
        routeName: busForm.routeName,
        contact: busForm.contact,
      };

      await axios.put(
        `http://localhost:5000/api/buses/${editingBus._id}`,
        busData
      );

      showSuccess("Success!", `Bus ${busForm.busNumber} updated successfully`);

      setBusForm({
        busNumber: "",
        busName: "",
        routeName: "",
        contact: "",
      });
      setEditingBus(null);
      fetchBuses();
    } catch (error) {
      console.error("Error updating bus:", error);
      showError(
        "Error",
        error.response?.data?.message ||
          "Failed to update bus. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBus = async (busId, busNumber) => {
    if (window.confirm(`Are you sure you want to delete bus ${busNumber}?`)) {
      try {
        await axios.delete(`http://localhost:5000/api/buses/${busId}`);
        showSuccess("Deleted!", `Bus ${busNumber} has been removed`);
        fetchBuses();
      } catch (error) {
        console.error("Error deleting bus:", error);
        showError("Error", "Failed to delete bus");
      }
    }
  };

  const handleAddRoute = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validWaypoints = routeForm.waypoints.filter(
        (wp) => wp.name && wp.lat !== "" && wp.lng !== ""
      );
      if (validWaypoints.length < 2) {
        showError(
          "Validation Error",
          "Please add at least two complete waypoints (name, lat, lng)."
        );
        setLoading(false);
        return;
      }

      const routeData = {
        routeName: routeForm.routeName,
        waypoints: validWaypoints.map((wp) => ({
          name: wp.name,
          lat: Number.parseFloat(wp.lat),
          lng: Number.parseFloat(wp.lng),
        })),
      };

      await axios.post("http://localhost:5000/api/routes", routeData);

      showSuccess(
        "Success!",
        `Route "${routeForm.routeName}" added successfully`
      );

      setRouteForm({
        routeName: "",
        waypoints: [{ name: "", lat: "", lng: "" }],
      });
      setWaypointSuggestions({}); 
      fetchRoutes();
    } catch (error) {
      console.error("Error adding route:", error);
      showError(
        "Error",
        error.response?.data?.message ||
          "Failed to add route. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditRoute = (route) => {
    setEditingRoute(route);
    setRouteForm({
      routeName: route.routeName,
      waypoints: route.waypoints.map((wp) => ({
        name: wp.name,
        lat: wp.lat.toFixed(6),
        lng: wp.lng.toFixed(6),
      })),
    });
    setWaypointSuggestions({});
    setActiveTab("manage-routes"); 
  };

  const handleUpdateRoute = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validWaypoints = routeForm.waypoints.filter(
        (wp) => wp.name && wp.lat !== "" && wp.lng !== ""
      );
      if (validWaypoints.length < 2) {
        showError(
          "Validation Error",
          "Please add at least two complete waypoints (name, lat, lng)."
        );
        setLoading(false);
        return;
      }

      const routeData = {
        routeName: routeForm.routeName,
        waypoints: validWaypoints.map((wp) => ({
          name: wp.name,
          lat: Number.parseFloat(wp.lat),
          lng: Number.parseFloat(wp.lng),
        })),
      };

      await axios.put(
        `http://localhost:5000/api/routes/${editingRoute._id}`,
        routeData
      );

      showSuccess(
        "Success!",
        `Route "${routeForm.routeName}" updated successfully`
      );

      setRouteForm({
        routeName: "",
        waypoints: [{ name: "", lat: "", lng: "" }],
      });
      setEditingRoute(null);
      setWaypointSuggestions({}); 
      fetchRoutes();
    } catch (error) {
      console.error("Error updating route:", error);
      showError(
        "Error",
        error.response?.data?.message ||
          "Failed to update route. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoute = async (routeId, routeName) => {
    if (
      window.confirm(`Are you sure you want to delete route "${routeName}"?`)
    ) {
      try {
        await axios.delete(`http://localhost:5000/api/routes/${routeId}`);
        showSuccess("Deleted!", `Route "${routeName}" has been removed`);
        fetchRoutes();
      } catch (error) {
        console.error("Error deleting route:", error);
        showError("Error", "Failed to delete route");
      }
    }
  };

  const renderAddBusTab = () => (
    <div>
      <h2 className="section-title">
        {editingBus ? "Edit Bus" : "Add New Bus"}
      </h2>

      <form
        onSubmit={editingBus ? handleUpdateBus : handleAddBus}
        className="admin-form"
      >
        <div className="form-group">
          <label className="form-label">Bus Number</label>
          <input
            type="text"
            name="busNumber"
            className="form-input"
            placeholder="e.g., BUS001"
            value={busForm.busNumber}
            onChange={handleBusFormChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Bus Name</label>
          <input
            type="text"
            name="busName"
            className="form-input"
            placeholder="e.g., City Express"
            value={busForm.busName}
            onChange={handleBusFormChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Assign Route</label>
          <select
            name="routeName"
            className="form-input"
            value={busForm.routeName}
            onChange={handleBusFormChange}
            required
          >
            <option value="">Select a Route</option>
            {routes.map((route) => (
              <option key={route._id} value={route.routeName}>
                {route.routeName}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Contact Number</label>
          <input
            type="tel"
            name="contact"
            className="form-input"
            placeholder="e.g., +1234567890"
            value={busForm.contact}
            onChange={handleBusFormChange}
            required
          />
        </div>

        <button type="submit" className="submit-button" disabled={loading}>
          {loading
            ? "⏳ Processing..."
            : editingBus
            ? "💾 Update Bus"
            : "➕ Add Bus"}
        </button>
        {editingBus && (
          <button
            type="button"
            className="cancel-button"
            onClick={() => {
              setEditingBus(null);
              setBusForm({
                busNumber: "",
                busName: "",
                routeName: "",
                contact: "",
              });
            }}
          >
            🚫 Cancel
          </button>
        )}
      </form>
    </div>
  );

  const renderManageBusesTab = () => (
    <div>
      <h2 className="section-title">Manage Buses ({buses.length})</h2>

      {buses.length === 0 ? (
        <div className="no-data">
          No buses found. Add some buses to get started.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="buses-table">
            <thead>
              <tr>
                <th>Bus Number</th>
                <th>Bus Name</th>
                <th>Route</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {buses.map((bus) => (
                <tr key={bus._id}>
                  <td>
                    <strong>{bus.busNumber}</strong>
                  </td>
                  <td>{bus.busName}</td>
                  <td>{bus.routeName}</td>
                  <td>{bus.contact}</td>

                  <td>
                    <button
                      className="action-button edit-button"
                      onClick={() => handleEditBus(bus)}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="action-button delete-button"
                      onClick={() => handleDeleteBus(bus._id, bus.busNumber)}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderManageRoutesTab = () => (
    <div>
      <h2 className="section-title">Manage Routes ({routes.length})</h2>

      <div className="admin-form-section">
        <h3 className="form-title">
          {editingRoute ? "✏️ Edit Route" : "➕ Add New Route"}
        </h3>
        <form
          onSubmit={editingRoute ? handleUpdateRoute : handleAddRoute}
          className="admin-form"
        >
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label">Route Name</label>
            <input
              type="text"
              name="routeName"
              className="form-input"
              placeholder="e.g., Bangalore to Mangalore"
              value={routeForm.routeName}
              onChange={handleRouteFormChange}
              required
            />
          </div>

          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label">Waypoints (Stops)</label>
            {routeForm.waypoints.map((waypoint, index) => (
              <div key={index} className="waypoint-input-group">
                <div style={{ position: "relative", flex: "2" }}>
                  {" "}
                  <input
                    type="text"
                    style={{ width: "100%" }}
                    name="name"
                    autocomplete="off"
                    placeholder="Stop Name (e.g., Bengaluru)"
                    value={waypoint.name}
                    onChange={(e) => handleWaypointChange(index, e)}
                    onBlur={() =>
                      setTimeout(
                        () =>
                          setWaypointSuggestions((prev) => ({
                            ...prev,
                            [index]: [],
                          })),
                        200
                      )
                    }
                    required
                  />
                  {waypointSuggestions[index] &&
                    waypointSuggestions[index].length > 0 && (
                      <ul className="suggestions-list">
                        {waypointSuggestions[index].map(
                          (suggestion, sIndex) => (
                            <li
                              key={sIndex}
                              onMouseDown={() =>
                                handleSelectSuggestion(index, suggestion)
                              }
                            >
                              {suggestion.address}
                            </li>
                          )
                        )}
                      </ul>
                    )}
                </div>

                {routeForm.waypoints.length > 1 && (
                  <button
                    type="button"
                    style={{ marginLeft: "1rem" }}
                    onClick={() => removeWaypoint(index)}
                    className="remove-waypoint-button"
                  >
                    −
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addWaypoint}
              className="add-waypoint-button"
            >
              + Add Waypoint
            </button>
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading
              ? "⏳ Processing..."
              : editingRoute
              ? "💾 Update Route"
              : "➕ Add Route"}
          </button>
          {editingRoute && (
            <button
              type="button"
              className="cancel-button"
              onClick={() => {
                setEditingRoute(null);
                setRouteForm({
                  routeName: "",
                  waypoints: [{ name: "", lat: "", lng: "" }],
                });
                setWaypointSuggestions({});
              }}
            >
              🚫 Cancel
            </button>
          )}
        </form>
      </div>

      <div className="admin-form-section" style={{ marginTop: "2rem" }}>
        <h3 className="form-title">Existing Routes</h3>
        {routes.length === 0 ? (
          <div className="no-data">No routes defined yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="buses-table">
              <thead>
                <tr>
                  <th>Route Name</th>
                  <th>Number of Stops</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((route) => (
                  <tr key={route._id}>
                    <td>
                      <strong>{route.routeName}</strong>
                    </td>
                    <td>{route.waypoints.length}</td>
                    <td>
                      <button
                        className="action-button edit-button"
                        onClick={() => handleEditRoute(route)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="action-button delete-button"
                        onClick={() =>
                          handleDeleteRoute(route._id, route.routeName)
                        }
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  if (authLoading) {
    return (
      <div className="admin-page">
        <div className="container">
          <div className="loading-message">
            <h2>Authenticating Admin...</h2>
            <p>Please wait</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-header">
          <h1 className="admisn-title"> Admin Panel</h1>
        </div>

        <div className="admin-tabs">
          <button
            className={`tab-button ${activeTab === "add-bus" ? "active" : ""}`}
            onClick={() => setActiveTab("add-bus")}
          >
            ➕ Add Bus
          </button>
          <button
            className={`tab-button ${
              activeTab === "manage-buses" ? "active" : ""
            }`}
            onClick={() => setActiveTab("manage-buses")}
          >
            Manage Buses
          </button>
          <button
            className={`tab-button ${
              activeTab === "manage-routes" ? "active" : ""
            }`}
            onClick={() => setActiveTab("manage-routes")}
          >
            Manage Routes
          </button>
        </div>

        <div className="admin-content">
          {activeTab === "add-bus" && renderAddBusTab()}
          {activeTab === "manage-buses" && renderManageBusesTab()}
          {activeTab === "manage-routes" && renderManageRoutesTab()}
        </div>
      </div>
    </div>
  );
};

export default Admin;
