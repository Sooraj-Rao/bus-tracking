const express = require("express")
const router = express.Router()
const Route = require("../models/route")

// Get all routes
router.get("/", async (req, res) => {
  try {
    const routes = await Route.find().sort({ routeName: 1 })
    res.json(routes)
  } catch (error) {
    res.status(500).json({ message: "Error fetching routes", error })
  }
})

// Create a new route
router.post("/", async (req, res) => {
  try {
    const { routeName, waypoints } = req.body
    if (!routeName || !waypoints || waypoints.length < 2) {
      return res.status(400).json({ message: "Route name and at least two waypoints are required." })
    }

    // Ensure waypoints have order property
    const orderedWaypoints = waypoints.map((wp, index) => ({ ...wp, order: index }))

    const newRoute = new Route({ routeName, waypoints: orderedWaypoints })
    await newRoute.save()
    res.status(201).json(newRoute)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Route name already exists." })
    }
    res.status(400).json({ message: "Error creating route", error: error.message })
  }
})

// Get a single route by ID
router.get("/:id", async (req, res) => {
  try {
    const route = await Route.findById(req.params.id)
    if (!route) {
      return res.status(404).json({ message: "Route not found" })
    }
    res.json(route)
  } catch (error) {
    res.status(500).json({ message: "Error fetching route", error })
  }
})

// Update a route
router.put("/:id", async (req, res) => {
  try {
    const { routeName, waypoints } = req.body
    if (!routeName || !waypoints || waypoints.length < 2) {
      return res.status(400).json({ message: "Route name and at least two waypoints are required." })
    }

    const orderedWaypoints = waypoints.map((wp, index) => ({ ...wp, order: index }))

    const updatedRoute = await Route.findByIdAndUpdate(
      req.params.id,
      { routeName, waypoints: orderedWaypoints },
      { new: true, runValidators: true },
    )
    if (!updatedRoute) {
      return res.status(404).json({ message: "Route not found" })
    }
    res.json(updatedRoute)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Route name already exists." })
    }
    res.status(400).json({ message: "Error updating route", error: error.message })
  }
})

// Delete a route
router.delete("/:id", async (req, res) => {
  try {
    const deletedRoute = await Route.findByIdAndDelete(req.params.id)
    if (!deletedRoute) {
      return res.status(404).json({ message: "Route not found" })
    }
    res.json({ message: "Route deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Error deleting route", error })
  }
})

module.exports = router
