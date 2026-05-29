// src/pages/Hitch.js
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./Hitch.css";
import MobileContainer from "../components/MobileContainer";
import { FiMapPin } from "react-icons/fi";
import LocationMapModal from "../components/LocationMapModal";

const BASE_URL = process.env.REACT_APP_API_URL;

export default function Hitch() {
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
  const [rides, setRides] = useState({});
  const [selectedRides, setSelectedRides] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showMap, setShowMap] = useState({ for: null });
  const [openProvider, setOpenProvider] = useState(null);
  const [showResultsView, setShowResultsView] = useState(false);
  const [bookProvider, setBookProvider] = useState(null);

  const pickupRef = useRef(null);
  const dropoffRef = useRef(null);
  const allProviders = ["Uber", "Lyft", "Local Taxi"];

  useEffect(() => {
    const savedState = localStorage.getItem("hitch_state");
    if (savedState) {
      const state = JSON.parse(savedState);
      setPickup(state.pickup || "");
      setDropoff(state.dropoff || "");
      setRides(state.rides || {});
      setSelectedRides(state.selectedRides || {});
      setShowResultsView(state.showResultsView || false);
      setOpenProvider(state.openProvider || null);
      setBookProvider(state.bookProvider || null);
    }
  }, []);

  useEffect(() => {
    const state = {
      pickup,
      dropoff,
      rides,
      selectedRides,
      showResultsView,
      openProvider,
      bookProvider,
    };
    localStorage.setItem("hitch_state", JSON.stringify(state));
  }, [pickup, dropoff, rides, selectedRides, showResultsView, openProvider, bookProvider]);

  const fetchSuggestions = async (query, setter) => {
    if (!query) return setter([]);
    try {
      const res = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: {
          q: query,
          format: "json",
          addressdetails: 1,
          countrycodes: "us",
          limit: 5,
        },
      });
      setter(res.data.map((item) => item.display_name));
    } catch {
      setter([]);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => fetchSuggestions(pickup, setPickupSuggestions), 300);
    return () => clearTimeout(delay);
  }, [pickup]);

  useEffect(() => {
    const delay = setTimeout(() => fetchSuggestions(dropoff, setDropoffSuggestions), 300);
    return () => clearTimeout(delay);
  }, [dropoff]);

  const handleSearch = async () => {
    if (pickup.trim().toLowerCase() === dropoff.trim().toLowerCase()) {
      setError("Pickup and drop-off cannot be the same.");
      return;
    }

    setLoading(true);
    setError("");
    setRides({});
    setSelectedRides({});
    setOpenProvider(null);
    setBookProvider(null);

    try {
      const res = await axios.post(`${BASE_URL}/api/hitch/estimate`, { pickup, dropoff });
      const estimates = res.data.estimates;
      const result = {};

      for (const type in estimates) {
        const final = estimates[type];
        const lower = type.toLowerCase();
        let category = null;
        if (lower.includes("uber")) category = "Uber";
        else if (lower.includes("lyft")) category = "Lyft";
        else if (type === "Taxi") category = "Local Taxi";

        if (!category) continue;

        const { finalFare, tax, bookingFee, eta, duration } = final;

        if (!result[category]) result[category] = [];
        result[category].push({
          type,
          price: `$${finalFare}`,
          tax: tax ? `$${tax}` : "N/A",
          bookingFee: bookingFee ? `$${bookingFee}` : "N/A",
          eta,
          duration,
        });
      }

      setRides(result);
      setShowResultsView(true);
    } catch (err) {
      const message = err?.response?.data?.error || "Could not retrieve estimates.";
      setError(message);
    }

    setLoading(false);
  };

  const handleRideSelect = (provider, ride) => {
    setSelectedRides((prev) => ({ ...prev, [provider]: ride }));
  };

  const renderSuggestions = (list, setter, setVisibleList) => (
    <div className="autocomplete-list">
      {list.map((item, idx) => (
        <div
          key={idx}
          className="autocomplete-item"
          onClick={() => {
            setter(item);
            setVisibleList([]);
          }}
        >
          {item}
        </div>
      ))}
    </div>
  );

  const renderCard = (provider, ride, idx) => {
    const selected = selectedRides[provider];
    const isSelected = selected?.type === ride.type;
    return (
      <div
        key={idx}
        className="ride-card"
        style={{ border: isSelected ? "2px solid #4CAF50" : "none", cursor: "pointer" }}
        onClick={() => handleRideSelect(provider, ride)}
      >
        <div className="ride-top">
          <span>{ride.type}</span>
          <span>{ride.price}</span>
        </div>
        <div className="ride-sub">
          <span>booking fee: {ride.bookingFee}</span>
          <span>tax: {ride.tax}</span>
          <span>Est. time: {ride.duration} min</span>
        </div>
        <div className="ride-bar-container">
          <div
            className="ride-bar"
            style={{
              width: `${ride.duration === "--" ? 50 : Math.min(ride.duration, 100)}%`,
              backgroundColor: "#4CAF50",
            }}
          ></div>
        </div>
      </div>
    );
  };

  const renderProviderTags = () => {
    const visible = allProviders.filter((p) => rides[p]);
    return (
      <div style={{ overflowX: "auto", display: "flex", gap: "10px", paddingBottom: "8px", paddingTop: "8px" }}>
        {visible.map((prov) => (
          <button
            key={prov}
            className="hitch-button"
            style={{
              whiteSpace: "nowrap",
              backgroundColor: openProvider === prov ? "#4CAF50" : "#000",
              flex: "0 0 auto",
              padding: "10px 16px",
              fontSize: "14px",
            }}
            onClick={() => setOpenProvider((prev) => (prev === prov ? null : prov))}
          >
            {prov}
          </button>
        ))}
      </div>
    );
  };

  const renderPriceComparison = () => (
    <div className="price-comparison-box">
      <h4>Final Price Comparison</h4>
      <div className="circle-row">
        {allProviders.map((prov) => {
          const rideList = rides[prov];
          const selected = selectedRides[prov];
          let price = "N/A";
          if (selected?.price) price = selected.price;
          else if (rideList?.[0]?.price) price = rideList[0].price;

          return (
            <div
              className={`circle ${price !== "N/A" ? "green" : "gray"}`}
              key={prov}
              style={{ cursor: price !== "N/A" ? "pointer" : "default" }}
              onClick={() => {
                if (price !== "N/A") {
                  const rideToSelect = selectedRides[prov] || rideList[0];
                  if (rideToSelect) handleRideSelect(prov, rideToSelect);
                  setBookProvider(prov);
                }
              }}
            >
              <strong>{price}</strong>
              <br />
              {prov}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderBookButton = () => {
    if (!bookProvider || !selectedRides[bookProvider]) return null;

    const commonStyle = {
      width: "100%",
      textAlign: "center",
      fontWeight: "bold",
      fontSize: "16px",
      padding: "14px",
      borderRadius: "12px",
      marginTop: "16px",
      display: "inline-block",
    };

    const links = {
      Uber: "https://www.uber.com/us/en/ride/",
      Lyft: "https://ride.lyft.com/",
      "Local Taxi": "https://www.google.com/maps/search/Taxi+Albany+NY",
    };

    const bg = {
      Uber: "#4caf50",
      Lyft: "#bf00ff",
      "Local Taxi": "#DAA520",
    };

    return (
      <a
        href={links[bookProvider]}
        target="_blank"
        rel="noopener noreferrer"
        className="book-button"
        style={{ ...commonStyle, backgroundColor: bg[bookProvider], color: "white" }}
      >
        {`Book with ${bookProvider}`}
      </a>
    );
  };

  return (
    <MobileContainer>
      <div className="hitch-container">
        <h2 className="hitch-title">Hitch</h2>

        {!showResultsView ? (
          <>
            <div className="hitch-form">
              <div className="input-with-btn" ref={pickupRef}>
                <input
                  className="hitch-input"
                  type="text"
                  placeholder="Pickup location"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                />
                <button className="loc-btn" onClick={() => setShowMap({ for: "pickup" })}>
                  <FiMapPin />
                </button>
                {pickupSuggestions.length > 0 &&
                  renderSuggestions(pickupSuggestions, setPickup, setPickupSuggestions)}
              </div>

              <div className="input-with-btn" ref={dropoffRef}>
                <input
                  className="hitch-input"
                  type="text"
                  placeholder="Drop-off location"
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                />
                <button className="loc-btn" onClick={() => setShowMap({ for: "dropoff" })}>
                  <FiMapPin />
                </button>
                {dropoffSuggestions.length > 0 &&
                  renderSuggestions(dropoffSuggestions, setDropoff, setDropoffSuggestions)}
              </div>

              <button className="hitch-button" onClick={handleSearch} disabled={loading}>
                {loading ? "Searching..." : "Search Rides"}
              </button>
            </div>
          </>
        ) : (
          <>
            {renderProviderTags()}
            {openProvider && rides[openProvider] && rides[openProvider].map((ride, idx) => renderCard(openProvider, ride, idx))}
            {renderPriceComparison()}
            {renderBookButton()}
            <button className="hitch-button" style={{ marginTop: "12px" }} onClick={() => setShowResultsView(false)}>
              Search New Ride
            </button>
          </>
        )}

        {error && <p className="hitch-error">{error}</p>}

        {showMap.for && (
          <LocationMapModal
            onClose={() => setShowMap({ for: null })}
            onSelect={(addr) => {
              if (showMap.for === "pickup") setPickup(addr);
              if (showMap.for === "dropoff") setDropoff(addr);
            }}
          />
        )}
      </div>
    </MobileContainer>
  );
}
