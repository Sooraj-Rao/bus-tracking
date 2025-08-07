const express = require("express");
const router = express.Router();
const axios = require("axios");

// Mock Geocoding Data (for demonstration)
const mockLocations = {
  bangalore: { lat: 12.9716, lng: 77.5946 },
  mangalore: { lat: 12.9141, lng: 74.856 },
  mysore: { lat: 12.2958, lng: 76.6394 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  delhi: { lat: 28.7041, lng: 77.1025 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  pune: { lat: 18.5204, lng: 73.8567 },
  kochi: { lat: 9.9312, lng: 76.2673 },
  goa: { lat: 15.2993, lng: 74.124 },
  // Add more mock locations as needed
};

// Geocoding endpoint
router.get("/geocode", async (req, res) => {
  const { address } = req.query;
  if (!address) {
    return res
      .status(400)
      .json({ message: "Address query parameter is required." });
  }

  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Try to find in mock data
  const normalizedAddress = address.toLowerCase().trim();
  if (mockLocations[normalizedAddress]) {
    return res.json({
      address: address,
      lat: mockLocations[normalizedAddress].lat,
      lng: mockLocations[normalizedAddress].lng,
    });
  }

  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        address
      )}&format=json&limit=1`
    );
    console.log(response.data);
    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return res.json({
        address: result.display_name,
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      });
    }
  } catch (apiError) {
    console.error("Nominatim API error:", apiError.message);
  }

  res.status(404).json({
    message: "Location not found or could not be geocoded.",
    lat: null,
    lng: null,
  });
});

module.exports = router;
