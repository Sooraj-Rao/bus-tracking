const mongoose = require("mongoose")

const waypointSchema = new mongoose.Schema({
  lat: Number,
  lng: Number,
  name: String,
  order: Number,
  timestamp: { type: Date, default: Date.now },
})

const gpsSchema = new mongoose.Schema({
  lat: Number,
  lng: Number,
  timestamp: { type: Date, default: Date.now },
})

const busSchema = new mongoose.Schema({
  busNumber: String,
  busName: String,
  routeName: String,
  contact: Number,
  currentLocation: gpsSchema,
  route: [gpsSchema], // Historical positions
  routeWaypoints: [waypointSchema], // Fixed route path
  routeProgress: { type: Number, default: 0 }, // Progress along route (0-1)
  direction: { type: Number, default: 1 }, // 1 for forward, -1 for backward
  startPoint: {
    lat: Number,
    lng: Number,
    name: String,
  },
  endPoint: {
    lat: Number,
    lng: Number,
    name: String,
  },
})

module.exports = mongoose.model("Bus", busSchema)
