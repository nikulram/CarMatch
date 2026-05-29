const express = require("express");
const router = express.Router();
const axios = require("axios");
const fareConfig = require("../utils/fareConfig");
const stateZoneMap = require("../utils/stateZoneMap");

const ORS_API_KEY = process.env.OPENROUTESERVICE_API_KEY;

async function geocode(address) {
  const res = await axios.get("https://nominatim.openstreetmap.org/search", {
    params: {
      q: address,
      format: "json",
      addressdetails: 1,
      limit: 1,
      countrycodes: "us",
    },
  });

  if (!res.data.length) return null;

  const place = res.data[0];
  return {
    lat: parseFloat(place.lat),
    lon: parseFloat(place.lon),
    state: place.address?.state || "Unknown",
    city: place.address?.city || place.address?.town || place.address?.village || "Unknown",
    country: place.address?.country || "Unknown",
  };
}

async function getRoute(from, to) {
  const res = await axios.post(
    "https://api.openrouteservice.org/v2/directions/driving-car",
    {
      coordinates: [
        [from.lon, from.lat],
        [to.lon, to.lat],
      ],
    },
    {
      headers: { Authorization: ORS_API_KEY },
    }
  );

  const summary = res.data.routes[0].summary;
  return {
    distanceKm: summary.distance / 1000,
    durationMin: summary.duration / 60,
  };
}

router.post("/estimate", async (req, res) => {
  try {
    const { pickup, dropoff } = req.body;

    const [pickupData, dropoffData] = await Promise.all([
      geocode(pickup),
      geocode(dropoff),
    ]);

    if (!pickupData || !dropoffData) {
      return res.status(400).json({ error: "Invalid pickup or dropoff location." });
    }

    if (
      pickupData.country !== "United States" ||
      dropoffData.country !== "United States"
    ) {
      return res.status(400).json({ error: "Only U.S. travel supported for now." });
    }

    const { distanceKm, durationMin } = await getRoute(pickupData, dropoffData);
    const miles = distanceKm * 0.621371;

    const zone = stateZoneMap[pickupData.state] || "mid";
    const zoneRates = fareConfig[zone];
    const bookingFee = zoneRates.bookingFee || 3.0;
    const estimates = {};

    for (const type in zoneRates) {
      if (type === "bookingFee") continue;

      const r = zoneRates[type];
      const isFlat = r.flat === true;

      let speed = 30;
      let duration = isFlat ? durationMin : (miles / speed) * 60;
      duration = Math.round(duration);
      const eta = Math.max(2, Math.round(duration / 4));

      const baseFare = isFlat
        ? r.base
        : r.base + (r.mile * miles) + (r.minute * duration);

      const taxableAmount = baseFare + bookingFee;
      const tax = taxableAmount * r.tax;
      const totalFare = baseFare + bookingFee + tax;

      estimates[type] = {
        baseFare: baseFare.toFixed(2),
        bookingFee: bookingFee.toFixed(2),
        tax: tax.toFixed(2),
        finalFare: totalFare.toFixed(2),
        eta,
        duration,
        distance: distanceKm.toFixed(2),
      };
    }

    res.json({
      estimates,
      zone,
      pickupCity: pickupData.city,
      pickupState: pickupData.state,
      miles: miles.toFixed(2),
    });

  } catch (err) {
    console.error("Estimate route error:", err.message);
    res.status(500).json({ error: "Failed to calculate estimate." });
  }
});

module.exports = router;
