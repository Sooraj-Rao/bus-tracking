const express = require("express")
const router = express.Router()
const Bus = require("../models/Bus")

// Route optimization endpoint
router.post("/optimize", async (req, res) => {
  try {
    const { startLocation, endLocation, selectedRoute, optimizationGoal, trafficCondition } = req.body

    // Simulate route optimization algorithm
    const buses = await Bus.find()
    let filteredBuses = buses

    if (selectedRoute !== "all") {
      filteredBuses = buses.filter((bus) => bus.routeName === selectedRoute)
    }

    // Calculate optimization metrics based on parameters
    const baseTime = 45
    const baseFuel = 12.5
    const baseDistance = 25.8

    const trafficMultiplier =
      {
        light: 0.8,
        normal: 1.0,
        heavy: 1.4,
      }[trafficCondition] || 1.0

    const optimizationMultiplier =
      {
        time: 0.85,
        fuel: 0.9,
        distance: 0.92,
        comfort: 0.88,
      }[optimizationGoal] || 0.85

    const optimizedTime = Math.round(baseTime * trafficMultiplier * optimizationMultiplier)
    const originalTime = Math.round(baseTime * trafficMultiplier)
    const fuelSaved =
      Math.round((baseFuel * trafficMultiplier - baseFuel * trafficMultiplier * optimizationMultiplier) * 10) / 10
    const distanceOptimized = Math.round(baseDistance * optimizationMultiplier * 10) / 10

    const suggestions = [
      {
        title: `Optimal Route via ${optimizationGoal === "time" ? "Highway" : "Efficient Path"}`,
        score: Math.floor(Math.random() * 15) + 85,
        details: `Recommended route considering ${optimizationGoal} optimization and ${trafficCondition} traffic conditions.`,
        benefits: [
          `${originalTime - optimizedTime} minutes saved`,
          `${fuelSaved}L fuel reduction`,
          `${optimizationGoal === "comfort" ? "Smoother ride quality" : "Faster arrival time"}`,
          `${Math.floor(Math.random() * 10) + 85}% reliability rate`,
        ],
      },
      {
        title: "Alternative Scenic Route",
        score: Math.floor(Math.random() * 20) + 70,
        details: "Balanced route with good performance across all metrics.",
        benefits: [
          "Consistent travel time",
          "Better passenger experience",
          "Lower vehicle maintenance",
          "High punctuality rate",
        ],
      },
      {
        title: "Express Route (Peak Hours)",
        score: Math.floor(Math.random() * 12) + 88,
        details: "Best for rush hour conditions with dedicated lanes.",
        benefits: [
          "Priority lane access",
          "Traffic signal optimization",
          "Reduced passenger wait time",
          "Peak hour efficiency",
        ],
      },
    ]

    const results = {
      metrics: {
        timeSaved: originalTime - optimizedTime,
        fuelSaved: fuelSaved,
        distanceOptimized: distanceOptimized,
        efficiencyGain: Math.round(((originalTime - optimizedTime) / originalTime) * 100),
      },
      suggestions: suggestions,
      parameters: {
        startLocation,
        endLocation,
        selectedRoute,
        optimizationGoal,
        trafficCondition,
      },
    }

    res.json(results)
  } catch (error) {
    res.status(500).json({ message: "Error optimizing routes", error })
  }
})

// Get traffic data
router.get("/traffic", async (req, res) => {
  try {
    // Simulate traffic data
    const trafficData = {
      currentCondition: ["light", "normal", "heavy"][Math.floor(Math.random() * 3)],
      averageSpeed: Math.floor(Math.random() * 20) + 30,
      congestionLevel: Math.floor(Math.random() * 100),
      incidents: Math.floor(Math.random() * 5),
      lastUpdated: new Date(),
    }

    res.json(trafficData)
  } catch (error) {
    res.status(500).json({ message: "Error fetching traffic data", error })
  }
})

module.exports = router
