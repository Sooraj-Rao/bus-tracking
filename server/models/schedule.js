const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bus",
    required: true,
  },
  routeName: {
    type: String,
    required: true,
  },
  departureTime: {
    type: String,
    required: true,
  },
  arrivalTime: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["scheduled", "delayed", "cancelled", "completed"],
    default: "scheduled",
  },
  estimatedDelay: {
    type: Number,
    default: 0,
  },
  passengers: {
    type: Number,
    default: 0,
  },
  maxCapacity: {
    type: Number,
    default: 50,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Schedule", scheduleSchema);
