const mongoose = require("mongoose")

const waypointSchema = new mongoose.Schema({
  name: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  order: { type: Number, required: true }, // To maintain order of stops
})

const routeSchema = new mongoose.Schema({
  routeName: {
    type: String,
    required: true,
    unique: true, // Ensure route names are unique
  },
  waypoints: [waypointSchema], // Array of stops for this route
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const Route = mongoose.models.Route || mongoose.model("Route", routeSchema);

module.exports = Route;