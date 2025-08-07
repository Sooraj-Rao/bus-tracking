const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/geocode", async (req, res) => {
  const { address } = req.query;
  if (!address) {
    return res
      .status(400)
      .json({ message: "Address query parameter is required." });
  }

  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        address
      )}&format=json&limit=10`
    );

    // const response = await axios.get(
    //   `https://api.locationiq.com/v1/autocomplete?key=pk.fdbf8afbcc5171c3ea121e5d2ea03eb4&q=${address}&limit=5&dedupe=1&`
    // );

    if (response.data && response.data.length > 0) {
      const results = response.data.map((result) => ({
        address: result.display_name,
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      }));
      return res.json(results);
    }
  } catch (apiError) {
    console.error("Nominatim API error:", apiError.message);
  }

  res.status(404).json([]);
});

module.exports = router;
