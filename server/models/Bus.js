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
  route: [gpsSchema], 
  routeWaypoints: [waypointSchema], 
  routeProgress: { type: Number, default: 0 }, 
  direction: { type: Number, default: 1 }, 
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
