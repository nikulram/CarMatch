import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import MobileContainer from "../components/MobileContainer";
import "./Dashboard.css";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [cars, setCars] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [tab, setTab] = useState("listings");
  const [viewMode, setViewMode] = useState("buy");
  const dropdownRef = useRef();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const API_URL = process.env.REACT_APP_API_URL;

  const fetchUser = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (err) {
      console.error("Failed to load profile", err);
    }
  }, [token, API_URL]);

  const fetchListings = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/cars/my-cars?userId=${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCars(res.data);
    } catch (err) {
      console.error("Failed to fetch listings", err);
    }
  }, [user?._id, token, API_URL]);

  useEffect(() => {
    fetchUser();
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [fetchUser]);

  useEffect(() => {
    if (user?._id && tab === "listings") {
      fetchListings();
    }
  }, [user?._id, tab, fetchListings]);

  const handleClickOutside = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setDropdownOpen(false);
    }
  };

  const deleteCar = async (id) => {
    try {
      await axios.delete(`${API_URL}/cars/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCars((prev) => prev.filter((car) => car._id !== id));
    } catch (err) {
      alert("Failed to delete car.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const filtered = cars.filter((car) =>
    viewMode === "rent" ? car.rentalModeEnabled : !car.rentalModeEnabled
  );

  return (
    <MobileContainer>
      <div className="dash-container">
        {/* Header */}
        <div className="dash-header">
          <button className="back-button" onClick={() => navigate("/profile")}>←</button>
          <h2>Dashboard</h2>
          <div className="menu-wrapper" ref={dropdownRef}>
            <button className="menu-button" onClick={() => setDropdownOpen(!dropdownOpen)}>⋮</button>
            {dropdownOpen && (
              <div className="dropdown-menu">
                <div onClick={() => navigate("/settings")}>Settings</div>
                <div onClick={handleLogout}>Logout</div>
              </div>
            )}
          </div>
        </div>

        {/* Welcome */}
        {user && (
          <div className="dash-user">
            <img
              src={user.profilePic || "/default-profile.png"}
              alt="Profile"
            />
            <p>Welcome back,</p>
            <h3>{user.firstName} {user.lastName}</h3>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: "12px", margin: "20px 0" }}>
          <button
            style={{
              flex: 1,
              padding: "10px",
              background: tab === "listings" ? "#000" : "#eee",
              color: tab === "listings" ? "#fff" : "#333",
              borderRadius: "8px",
              fontWeight: "bold",
              border: "none",
            }}
            onClick={() => setTab("listings")}
          >
            Manage Listings
          </button>
          <button
            style={{
              flex: 1,
              padding: "10px",
              background: tab === "purchases" ? "#000" : "#eee",
              color: tab === "purchases" ? "#fff" : "#333",
              borderRadius: "8px",
              fontWeight: "bold",
              border: "none",
            }}
            onClick={() => navigate("/manage-purchases")}
          >
            Manage My Purchases
          </button>
        </div>

        {/* Listings Tab */}
        {tab === "listings" && (
          <>
            {/* View Toggle */}
            <div style={{ display: "flex", gap: "12px", margin: "10px 0" }}>
              <button
                onClick={() => setViewMode("buy")}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: viewMode === "buy" ? "black" : "#eee",
                  color: viewMode === "buy" ? "white" : "#333",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  border: "none",
                }}
              >
                My Cars for Sale
              </button>
              <button
                onClick={() => setViewMode("rent")}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: viewMode === "rent" ? "black" : "#eee",
                  color: viewMode === "rent" ? "white" : "#333",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  border: "none",
                }}
              >
                My Rentals
              </button>
            </div>

            {/* Listings */}
            <div className="dash-listings">
              {filtered.length === 0 ? (
                <p>No {viewMode === "rent" ? "rental" : "buy"} listings yet.</p>
              ) : (
                <div className="car-list">
                  {filtered.map((car) => {
                    const isOverdue = car.isRented && new Date() > new Date(car.rentalEnd);
                    return (
                      <div className="car-card" key={car._id}>
                        <img src={car.image?.[0] || "/default-car.jpg"} alt="Car" />
                        <div className="car-info">
                          <h5>
                            {car.year} {car.make} {car.model}
                            {car.sold && !car.rentalModeEnabled && (
                              <span className="status-tag sold">SOLD</span>
                            )}
                            {car.isRented && car.rentalModeEnabled && (
                              <span className={`status-tag ${isOverdue ? "overdue" : "rented"}`}>
                                {isOverdue ? "OVERDUE" : "RENTED"}
                              </span>
                            )}
                          </h5>
                          <p>${car.price.toLocaleString()} • {car.mileage.toLocaleString()} miles</p>
                          {car.rentalEnd && car.rentalModeEnabled && (
                            <p style={{ fontSize: "12px", color: "#555", marginTop: "4px" }}>
                              {isOverdue ? "Was due: " : "Due: "}
                              {new Date(car.rentalEnd).toLocaleDateString()}
                            </p>
                          )}
                          <div className="car-buttons">
                            <button onClick={() => deleteCar(car._id)}>Delete</button>
                            <button onClick={() => navigate(`/edit-listing/${car._id}`)}>Edit</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </MobileContainer>
  );
}
