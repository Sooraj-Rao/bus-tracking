const express = require("express")
const router = express.Router()
const Booking = require("../models/Booking")
const sendEmail = require("../utils/sendEmail")
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to protect user routes
const protectUserRoute = (req, res, next) => {
    const token = req.headers['x-auth-token'];

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Attach user info to request
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid.' });
    }
};


// Create new booking
router.post("/", protectUserRoute, async (req, res) => { // Protect this route
  try {
    console.log("incoming booking data:", req.body)
    const { userName, contact, email, busId, fromLocation, toLocation, estimatedDistance, estimatedDuration } = req.body
    const userId = req.user.id; // Get userId from authenticated token

    if (!userName || !contact || !busId || !fromLocation || !toLocation || !userId) {
      return res.status(400).json({ message: "All required fields are missing or user not authenticated." })
    }

    const booking = new Booking({
      userName,
      contact,
      email,
      userId, // Save userId
      busId,
      fromLocation,
      toLocation,
      estimatedDistance,
      estimatedDuration,
    })

    await booking.save()

    const trackingLink = `http://localhost:5173/track/bus/${booking.busId}?bookingId=${booking._id}`
    const subject = "Bus Booking Confirmation - Track Your Journey"
    const html = `
        <h2>Hello ${userName},</h2>
        <p>Your bus booking was successful!</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3>Journey Details:</h3>
            <p><strong>From:</strong> ${fromLocation.name}</p>
            <p><strong>To:</strong> ${toLocation.name}</p>
            <p><strong>Estimated Duration:</strong> ${estimatedDuration} minutes</p>
            <p><strong>Distance:</strong> ${estimatedDistance} km</p>
        </div>
        <p>Track your bus journey using the link below:</p>
        <a href="${trackingLink}" style="background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">${trackingLink}</a>
        <p>Thank you for using our service!</p>
        `

    await sendEmail(email, subject, html)

    res.status(201).json({
      message: "Booking created successfully, tracking link sent to email",
      booking,
      trackingLink,
    })
  } catch (error) {
    console.error("Booking Failed:", error)
    res.status(500).json({ message: "Internal server error", error: error.message })
  }
})

// Get booking by ID (can be accessed by anyone with the ID, or protected for user's own bookings)
router.get("/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("busId")
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" })
    }
    res.status(200).json({ booking })
  } catch (error) {
    console.error("Error fetching booking:", error)
    res.status(500).json({ message: "Internal server error", error: error.message })
  }
})

// Get all bookings for a specific user
router.get("/user/:userId", protectUserRoute, async (req, res) => {
  try {
    // Ensure the requested userId matches the authenticated user's ID
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ message: "Access denied. You can only view your own bookings." });
    }
    const bookings = await Booking.find({ userId: req.params.userId }).populate("busId").sort({ createdAt: -1 });
    res.status(200).json({ bookings });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});


module.exports = router
