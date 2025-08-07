const express = require("express");
const router = express.Router();
const Schedule = require("../models/Schedule");
const Bus = require("../models/Bus");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const Booking = require("../models/Booking");
dotenv.config();

const protectUserRoute = (req, res, next) => {
  const token = req.headers["x-auth-token"];

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ message: "Token is not valid." });
  }
};

router.get("/", protectUserRoute, async (req, res) => {
  try {
    const schedules = await Booking.find({ userId: req.user.id }).populate(
      "busId"
    );
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: "Error fetching schedules", error });
  }
});

router.post("/", async (req, res) => {
  try {
    const schedule = new Schedule(req.body);
    await schedule.save();
    res.status(201).json(schedule);
  } catch (error) {
    res.status(400).json({ message: "Error creating schedule", error });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }
    res.json(schedule);
  } catch (error) {
    res.status(400).json({ message: "Error updating schedule", error });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndDelete(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }
    res.json({ message: "Schedule deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting schedule", error });
  }
});

module.exports = router;
