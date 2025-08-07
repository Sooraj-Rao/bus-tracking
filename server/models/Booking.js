const mongoose = require("mongoose")

const bookingSchema = new mongoose.Schema({
  userName: String,
  contact: Number,
  email: String,
  userId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false, 
  },
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bus",
  },
  fromLocation: {
    name: String,
    lat: Number,
    lng: Number,
  },
  toLocation: {
    name: String,
    lat: Number,
    lng: Number,
  },
  bookingStatus: {
    type: String,
    enum: ["confirmed", "in-transit", "completed", "cancelled"],
    default: "confirmed",
  },
  estimatedDuration: Number, 
  estimatedDistance: Number, 
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("Booking", bookingSchema)
