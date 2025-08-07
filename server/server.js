const express = require("express")
const busRoutes = require("./routes/busRoutes")
const bookingRoutes = require("./routes/bookingRoutes")
const scheduleRoutes = require("./routes/scheduleRoutes")
const optimizationRoutes = require("./routes/optimizationRoutes")
const routeManagementRoutes = require("./routes/routeManagementRoutes")
const authRoutes = require("./routes/authRoutes")
const geocodingRoutes = require("./routes/geocodingRoutes")
const adminAuthRoutes = require("./routes/adminAuthRoutes") // New: Import admin auth routes
const Bus = require("./models/Bus")
const Route = require("./models/route")
const Booking = require("./models/Booking") // Import Booking model for count
const cors = require("cors")
const dotenv = require("dotenv")
dotenv.config()

const RunServer = require("./database/connection")

const app = express()
const port = 5000

// Middleware
app.use(express.json())
app.use(cors())


  app.get("/api/bookings/count", async (req, res) => {
  try {
    const count = await Booking.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error("Error fetching booking count:", error);
    res.status(500).json({ message: "Failed to fetch booking count." });
  }
});

// Middleware to apply JWT verification for all routes except auth and public ones
app.use((req, res, next) => {
  // List of routes that do NOT require authentication
  const publicRoutes = [
    "/api/auth/register",
    "/api/auth/login",
    "/api/auth/verify-otp",
    "/api/admin/auth/login",
    "/api/buses", // Publicly accessible for tracking
    "/api/routes", // Publicly accessible for display
    "/api/schedules", // Publicly accessible for display
    "/api/geocoding/geocode", // Publicly accessible for map features
    "/api/health", // Health check
    "/api/bookings/count", // Publicly accessible for home page stats
  ];





  // Check if the current request path starts with any of the public routes
  const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));

  if (isPublicRoute) {
    return next(); // Skip authentication for public routes
  }

  // For all other routes, apply authentication middleware
  const token = req.header("x-auth-token");

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const jwt = require("jsonwebtoken"); // Import jwt here to avoid circular dependency if it's in authRoutes
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // Attach user info to request
    next();
  } catch (err) {
    console.error("Token verification error:", err.message);
    res.status(401).json({ message: "Token is not valid" });
  }
});


// Routes
app.use("/api/buses", busRoutes)
app.use("/api/bookings", bookingRoutes)
app.use("/api/schedules", scheduleRoutes)
app.use("/api/optimization", optimizationRoutes)
app.use("/api/routes", routeManagementRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/geocoding", geocodingRoutes)
app.use("/api/admin/auth", adminAuthRoutes)

// New endpoint for total booking count

// Initialize routes for existing buses (if they don't have routeWaypoints)
const initializeBusRoutes = async () => {
  try {
    const buses = await Bus.find()

    for (const bus of buses) {
      if (!bus.routeWaypoints || bus.routeWaypoints.length === 0) {
        // Find the route from the Route model based on bus.routeName
        const routeDefinition = await Route.findOne({ routeName: bus.routeName })

        if (routeDefinition && routeDefinition.waypoints.length > 0) {
          bus.routeWaypoints = routeDefinition.waypoints.map((point) => ({
            name: point.name,
            lat: point.lat,
            lng: point.lng,
            order: point.order,
          })).sort((a, b) => a.order - b.order); // Ensure waypoints are sorted by order

          bus.startPoint = bus.routeWaypoints[0]
          bus.endPoint = bus.routeWaypoints[bus.routeWaypoints.length - 1]
          bus.routeProgress = Math.random() // Random starting position
          bus.direction = Math.random() > 0.5 ? 1 : -1 // Random direction

          // Set current location based on route progress
          const currentWaypoint = interpolatePosition(bus.routeWaypoints, bus.routeProgress)
          bus.currentLocation = {
            lat: currentWaypoint.lat,
            lng: currentWaypoint.lng,
            timestamp: new Date(),
          }

          await bus.save()
          console.log(`✅ Initialized route for bus ${bus.busNumber} from dynamic routes`)
        } else {
          console.warn(`⚠️ No dynamic route found or waypoints empty for bus ${bus.busNumber} (Route: ${bus.routeName}). Falling back to default.`)
          // Fallback to a default if no dynamic route is found
          bus.routeWaypoints = [
            { lat: 28.6139, lng: 77.209, name: "Default Start", order: 0 },
            { lat: 28.65, lng: 77.242, name: "Default End", order: 1 },
          ]
          bus.startPoint = bus.routeWaypoints[0]
          bus.endPoint = bus.routeWaypoints[1]
          bus.currentLocation = {
            lat: bus.routeWaypoints[0].lat,
            lng: bus.routeWaypoints[0].lng,
            timestamp: new Date(),
          }
          await bus.save()
        }
      }
    }
  } catch (error) {
    console.error("Error initializing bus routes:", error)
  }
}

// Helper to calculate distance between two points (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// Helper to calculate total distance of a route
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

// Interpolate position along route based on progress (0-1)
const interpolatePosition = (waypoints, progress) => {
  if (!waypoints || waypoints.length < 2) return { lat: 28.6139, lng: 77.209 }; // Default if no waypoints

  const totalDistance = calculateTotalRouteDistance(waypoints);
  let currentDistance = progress * totalDistance;

  let accumulatedDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const segmentStart = waypoints[i];
    const segmentEnd = waypoints[i + 1];
    const segmentLength = calculateDistance(segmentStart.lat, segmentStart.lng, segmentEnd.lat, segmentEnd.lng);

    if (currentDistance <= accumulatedDistance + segmentLength) {
      // Position is within this segment
      const segmentProgress = (currentDistance - accumulatedDistance) / segmentLength;
      return {
        lat: segmentStart.lat + (segmentEnd.lat - segmentStart.lat) * segmentProgress,
        lng: segmentStart.lng + (segmentEnd.lng - segmentStart.lng) * segmentProgress,
      };
    }
    accumulatedDistance += segmentLength;
  }

  // If progress is 1 or beyond, return the last waypoint
  return waypoints[waypoints.length - 1];
};


// Enhanced GPS simulation with route-based movement
const simulateGPS = async () => {
  try {
    const buses = await Bus.find();

    for (const bus of buses) {
      if (!bus.routeWaypoints || bus.routeWaypoints.length < 2) {
        // If bus doesn't have dynamic waypoints, try to fetch them
        const routeDefinition = await Route.findOne({ routeName: bus.routeName });
        if (routeDefinition && routeDefinition.waypoints.length > 0) {
          bus.routeWaypoints = routeDefinition.waypoints.map((point) => ({
            name: point.name,
            lat: point.lat,
            lng: point.lng,
            order: point.order,
          })).sort((a, b) => a.order - b.order); // Ensure waypoints are sorted by order
          bus.startPoint = bus.routeWaypoints[0];
          bus.endPoint = bus.routeWaypoints[bus.routeWaypoints.length - 1];
          bus.routeProgress = bus.routeProgress || 0; // Keep existing progress or start at 0
          bus.direction = bus.direction || 1; // Keep existing direction or start forward
        } else {
          console.warn(`⚠️ Bus ${bus.busNumber} has no defined route waypoints for simulation. Skipping.`);
          continue; // Skip simulation for this bus if no route is defined
        }
      }

      // Move along the route
      const segmentSpeed = 0.005; // Smaller increment for smoother movement along segments
      let newProgress = bus.routeProgress + segmentSpeed * bus.direction;
      let newDirection = bus.direction;

      // Handle route boundaries
      if (newProgress >= 1) {
        newProgress = 1;
        newDirection = -1; // Reverse direction
      } else if (newProgress <= 0) {
        newProgress = 0;
        newDirection = 1; // Forward direction
      }

      // Get new position based on progress
      const newPosition = interpolatePosition(bus.routeWaypoints, newProgress);

      const newLocation = {
        lat: newPosition.lat,
        lng: newPosition.lng,
        timestamp: new Date(),
      };

      bus.currentLocation = newLocation;
      bus.routeProgress = newProgress;
      bus.direction = newDirection;
      bus.route.push(newLocation); // Add current location to historical route

      // Keep only last 20 route points for performance
      if (bus.route.length > 20) {
        bus.route = bus.route.slice(-20);
      }

      await bus.save();
    }
  } catch (error) {
    console.error("Error in GPS simulation:", error);
  }
}

// Update GPS every 5 seconds
setInterval(simulateGPS, 5000)


// Initialize database connection and routes
RunServer()

// Initialize bus routes after database connection
setTimeout(initializeBusRoutes, 2000)

app.listen(port, () => {
  console.log(`🚀 Bus Tracking Server running on port ${port}`)
})
