const express = require("express");
const router = express.Router();
const Schedule = require("../models/Schedule");
const Bus = require("../models/Bus");

// Get all schedules
router.get("/", async (req, res) => {
  try {
    const { date, route } = req.query;
    const query = {};

    if (date) {
      query.date = new Date(date);
    }

    if (route && route !== "all") {
      query.routeName = route;
    }

    const schedules = await Schedule.find(query).populate("busId");
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: "Error fetching schedules", error });
  }
});

// Create new schedule
router.post("/", async (req, res) => {
  try {
    const schedule = new Schedule(req.body);
    await schedule.save();
    res.status(201).json(schedule);
  } catch (error) {
    res.status(400).json({ message: "Error creating schedule", error });
  }
});

// Update schedule
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

// Delete schedule
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
