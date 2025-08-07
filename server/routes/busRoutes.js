const express = require("express")
const router = express.Router()
const Bus = require("../models/Bus")
const Route = require("../models/route") 


router.get("/", async (req, res) => {
  const buses = await Bus.find()
  res.json(buses)
})


router.post("/", async (req, res) => {
  try {
    const busData = req.body

    
    const routeDefinition = await Route.findOne({ routeName: busData.routeName })

    if (!routeDefinition || routeDefinition.waypoints.length < 2) {
      return res.status(400).json({ message: "Selected route not found or has insufficient waypoints." })
    }

    
    busData.routeWaypoints = routeDefinition.waypoints.map((point) => ({
      name: point.name,
      lat: point.lat,
      lng: point.lng,
      order: point.order,
    }))

    busData.startPoint = routeDefinition.waypoints[0]
    busData.endPoint = routeDefinition.waypoints[routeDefinition.waypoints.length - 1]
    busData.routeProgress = 0 
    busData.direction = 1 

    
    busData.currentLocation = {
      lat: busData.startPoint.lat,
      lng: busData.startPoint.lng,
      timestamp: new Date(),
    }

    const bus = new Bus(busData)
    await bus.save()
    res.status(201).json(bus)
  } catch (error) {
    res.status(400).json({ message: "Failed to add bus", error: error.message })
  }
})


router.get("/:id", async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id)
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" })
    }
    res.json(bus)
  } catch (err) {
    res.status(500).json({ message: "Error fetching bus", error: err })
  }
})


router.delete("/:id", async (req, res) => {
  try {
    const bus = await Bus.findByIdAndDelete(req.params.id)
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" })
    }
    res.json({message:'Success'})
  } catch (err) {
    res.status(500).json({ message: "Error fetching bus", error: err })
  }
})



router.put("/:id", async (req, res) => {
  try {
    const busData = req.body;
    const routeDefinition = await Route.findOne({ routeName: busData.routeName });

    if (!routeDefinition || routeDefinition.waypoints.length < 2) {
      return res.status(400).json({ message: "Selected route not found or has insufficient waypoints." });
    }

    busData.routeWaypoints = routeDefinition.waypoints.map((point) => ({
      name: point.name,
      lat: point.lat,
      lng: point.lng,
      order: point.order,
    }));
    busData.startPoint = routeDefinition.waypoints[0];
    busData.endPoint = routeDefinition.waypoints[routeDefinition.waypoints.length - 1];
    busData.currentLocation = {
      lat: busData.startPoint.lat,
      lng: busData.startPoint.lng,
      timestamp: new Date(),
    };

    const updatedBus = await Bus.findByIdAndUpdate(req.params.id, busData, { new: true, runValidators: true });
    if (!updatedBus) {
      return res.status(404).json({ message: "Bus not found" });
    }
    res.json(updatedBus);
  } catch (error) {
    res.status(400).json({ message: "Error updating bus", error: error.message });
  }
});


router.get("/routes/available", async (req, res) => {
  try {
    const routes = await Route.find({}, "routeName waypoints").sort({ routeName: 1 })
    res.json(routes)
  } catch (error) {
    res.status(500).json({ message: "Error fetching available routes", error })
  }
})

module.exports = router
