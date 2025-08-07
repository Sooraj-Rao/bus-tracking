const express = require("express");
const busRoutes = require("./routes/busRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const optimizationRoutes = require("./routes/optimizationRoutes");
const routeManagementRoutes = require("./routes/routeManagementRoutes");
const authRoutes = require("./routes/authRoutes");
const geocodingRoutes = require("./routes/geocodingRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const Bus = require("./models/Bus");
const Route = require("./models/route");
const Booking = require("./models/Booking");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const RunServer = require("./database/connection");

const app = express();
const port = 5000;

app.use(express.json());
app.use(cors());

app.get("/api/bookings/count", async (req, res) => {
  try {
    const count = await Booking.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error("Error fetching booking count:", error);
    res.status(500).json({ message: "Failed to fetch booking count." });
  }
});

app.use((req, res, next) => {
  const publicRoutes = [
    "/api/auth/register",
    "/api/auth/login",
    "/api/auth/verify-otp",
    "/api/admin/auth/login",
    "/api/buses",
    "/api/routes",
    "/api/geocoding/geocode",
    "/api/health",
    "/api/bookings/count",
  ];

  const isPublicRoute = publicRoutes.some((route) =>
    req.path.startsWith(route)
  );

  if (isPublicRoute) {
    return next();
  }

  const token = req.header("x-auth-token");
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error("Token verification error:", err.message);
    res.status(401).json({ message: "Token is not valid" });
  }
});

app.use("/api/buses", busRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/optimization", optimizationRoutes);
app.use("/api/routes", routeManagementRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/geocoding", geocodingRoutes);
app.use("/api/admin/auth", adminAuthRoutes);

const initializeBusRoutes = async () => {
  try {
    const buses = await Bus.find();

    for (const bus of buses) {
      if (!bus.routeWaypoints || bus.routeWaypoints.length === 0) {
        const routeDefinition = await Route.findOne({
          routeName: bus.routeName,
        });

        if (routeDefinition && routeDefinition.waypoints.length > 0) {
          bus.routeWaypoints = routeDefinition.waypoints
            .map((point) => ({
              name: point.name,
              lat: point.lat,
              lng: point.lng,
              order: point.order,
            }))
            .sort((a, b) => a.order - b.order);

          bus.startPoint = bus.routeWaypoints[0];
          bus.endPoint = bus.routeWaypoints[bus.routeWaypoints.length - 1];
          bus.routeProgress = Math.random();
          bus.direction = Math.random() > 0.5 ? 1 : -1;

          const currentWaypoint = interpolatePosition(
            bus.routeWaypoints,
            bus.routeProgress
          );
          bus.currentLocation = {
            lat: currentWaypoint.lat,
            lng: currentWaypoint.lng,
            timestamp: new Date(),
          };

          await bus.save();
          console.log(
            `✅ Initialized route for bus ${bus.busNumber} from dynamic routes`
          );
        } else {
          console.warn(
            `⚠️ No dynamic route found or waypoints empty for bus ${bus.busNumber} (Route: ${bus.routeName}). Falling back to default.`
          );

          bus.routeWaypoints = [
            { lat: 28.6139, lng: 77.209, name: "Default Start", order: 0 },
            { lat: 28.65, lng: 77.242, name: "Default End", order: 1 },
          ];
          bus.startPoint = bus.routeWaypoints[0];
          bus.endPoint = bus.routeWaypoints[1];
          bus.currentLocation = {
            lat: bus.routeWaypoints[0].lat,
            lng: bus.routeWaypoints[0].lng,
            timestamp: new Date(),
          };
          await bus.save();
        }
      }
    }
  } catch (error) {
    console.error("Error initializing bus routes:", error);
  }
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateTotalRouteDistance = (waypoints) => {
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

const interpolatePosition = (waypoints, progress) => {
  if (!waypoints || waypoints.length < 2) return { lat: 28.6139, lng: 77.209 };

  const totalDistance = calculateTotalRouteDistance(waypoints);
  let currentDistance = progress * totalDistance;

  let accumulatedDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const segmentStart = waypoints[i];
    const segmentEnd = waypoints[i + 1];
    const segmentLength = calculateDistance(
      segmentStart.lat,
      segmentStart.lng,
      segmentEnd.lat,
      segmentEnd.lng
    );

    if (currentDistance <= accumulatedDistance + segmentLength) {
      const segmentProgress =
        (currentDistance - accumulatedDistance) / segmentLength;
      return {
        lat:
          segmentStart.lat +
          (segmentEnd.lat - segmentStart.lat) * segmentProgress,
        lng:
          segmentStart.lng +
          (segmentEnd.lng - segmentStart.lng) * segmentProgress,
      };
    }
    accumulatedDistance += segmentLength;
  }

  return waypoints[waypoints.length - 1];
};

const simulateGPS = async () => {
  try {
    const buses = await Bus.find();

    for (const bus of buses) {
      if (!bus.routeWaypoints || bus.routeWaypoints.length < 2) {
        const routeDefinition = await Route.findOne({
          routeName: bus.routeName,
        });
        if (routeDefinition && routeDefinition.waypoints.length > 0) {
          bus.routeWaypoints = routeDefinition.waypoints
            .map((point) => ({
              name: point.name,
              lat: point.lat,
              lng: point.lng,
              order: point.order,
            }))
            .sort((a, b) => a.order - b.order);
          bus.startPoint = bus.routeWaypoints[0];
          bus.endPoint = bus.routeWaypoints[bus.routeWaypoints.length - 1];
          bus.routeProgress = bus.routeProgress || 0;
          bus.direction = bus.direction || 1;
        } else {
          console.warn(
            `⚠️ Bus ${bus.busNumber} has no defined route waypoints for simulation. Skipping.`
          );
          continue;
        }
      }

      const segmentSpeed = 0.005;
      let newProgress = bus.routeProgress + segmentSpeed * bus.direction;
      let newDirection = bus.direction;

      if (newProgress >= 1) {
        newProgress = 1;
        newDirection = -1;
      } else if (newProgress <= 0) {
        newProgress = 0;
        newDirection = 1;
      }

      const newPosition = interpolatePosition(bus.routeWaypoints, newProgress);

      const newLocation = {
        lat: newPosition.lat,
        lng: newPosition.lng,
        timestamp: new Date(),
      };

      bus.currentLocation = newLocation;
      bus.routeProgress = newProgress;
      bus.direction = newDirection;
      bus.route.push(newLocation);

      if (bus.route.length > 20) {
        bus.route = bus.route.slice(-20);
      }

      await bus.save();
    }
  } catch (error) {
    console.error("Error in GPS simulation:", error);
  }
};

setInterval(simulateGPS, 5000);

RunServer();

setTimeout(initializeBusRoutes, 2000);

app.listen(port, () => {
  console.log(`🚀 Bus Tracking Server running on port ${port}`);
});
