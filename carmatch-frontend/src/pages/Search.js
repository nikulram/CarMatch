// src/pages/Search.js
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { FaHeart, FaThLarge, FaUndo } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import GridFilterPanel from "../components/GridFilterPanel";
import GridView from "../components/GridView";
import MobileContainer from "../components/MobileContainer";
import SwipeCard from "../components/SwipeCard";
import "./Search.css";

export default function Search() {
  const [cars, setCars] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [isGrid, setIsGrid] = useState(false);
  const [searchMode, setSearchMode] = useState("vehicles");
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [viewMode, setViewMode] = useState("buy");
  const [disliked, setDisliked] = useState([]); 

  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL;

  const groupedTags = {
    Car: ["Car (Standard)", "Convertible", "Hatchback", "Sedan", "Luxury Car", "Sports Car", "Station Wagon", "Crossover", "Jeep", "Minivan"],
    Bike: ["Bicycle", "Cruiser Bike", "Dirt Bike", "Motorbike / Motorcycle", "Sports Bike", "Touring Bike", "Electric Bicycle (E-Bike)", "Moped", "Scooter"],
    "Truck & Pickup": ["Pickup Truck", "Truck (Heavy Duty)", "Truck (Light Duty)", "Van"],
    "Utility & Off-road": ["ATV", "Go-Kart", "Golf Cart", "Camper Van / RV", "Off-Road Vehicle"],
    Electric: ["Electric Car (EV)", "Electric Scooter (E-Scooter)", "Hybrid Car"],
    Custom: ["Custom Vehicle"],
  };

  const allTags = Object.values(groupedTags).flat();

  const filterSoldCars = (cars) => {
    return cars.filter(car => !car.sold);
  }
  
  const filterAndSetCars = useCallback((allCars, favIds, dislikedIds) => {
    const filtered = allCars.filter(car => {
      if (car.sold) return false; 
  
      const isRental = car.rentalModeEnabled === true;
      if (viewMode === "buy" && isRental) return false;
      if (viewMode === "rent" && !isRental) return false;
  
      const vehicleType = (car.vehicleType || "").toLowerCase();
      const selectedTagsLower = selectedTags.map(tag => tag.toLowerCase());
      return selectedTags.length === 0 || selectedTagsLower.includes(vehicleType);
    });
  
    const updatedFavorites = favIds.filter(favId => {
      const car = allCars.find(c => c._id === favId);
      return car && !car.sold;
    });
  
    const updatedDisliked = dislikedIds.filter(dislikedId => {
      const car = allCars.find(c => c._id === dislikedId);
      return car && !car.sold;
    });
  
    setCars(allCars);
    setFavorites(updatedFavorites);
    setDisliked(updatedDisliked);
    setFilteredCars(filtered);
    setCurrentIndex(0);
  }, [selectedTags, viewMode]);
  
  

  const fetchAll = useCallback(async () => {
    try {
      const [carsRes, profileRes] = await Promise.all([
        axios.get(`${API_URL}/cars/cars`),
        axios.get(`${API_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);
  
      const allCars = carsRes.data || [];
      const favIds = new Set((profileRes.data.favorites || []).map(f => f._id || f));
      const dislikedIds = new Set((profileRes.data.disliked || []).map(f => f._id || f));
  
      
      const updatedFavorites = Array.from(favIds).filter(favId => {
        const car = allCars.find(c => c._id === favId);
        return car && !car.sold;
      });
  
      const updatedDisliked = Array.from(dislikedIds).filter(dislikedId => {
        const car = allCars.find(c => c._id === dislikedId);
        return car && !car.sold; 
      });
  
      filterAndSetCars(allCars, updatedFavorites, updatedDisliked);
    } catch (err) {
      console.error("Failed to fetch all data:", err);
    }
  }, [token, filterAndSetCars, API_URL]);
  

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSwipe = async (dir, car) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
  
      const makeRequest = async (baseUrl) => {
        if (dir === "right") {
          await axios.put(`${baseUrl}/profile/favorites`, {
            carId: car._id,
            action: "add"
          }, { headers });
        } else {
          if (favorites.includes(car._id)) {
            await axios.put(`${baseUrl}/profile/favorites`, {
              carId: car._id,
              action: "remove"
            }, { headers });
          }
  
          await axios.put(`${baseUrl}/profile/disliked`, {
            carId: car._id,
            action: "add"
          }, { headers });
        }
      };
  
      try {
        await makeRequest(`http://localhost:5000`);
      } catch (err) {
        console.warn("Localhost failed, falling back to API_URL", err);
        await makeRequest(API_URL);
      }
  
      // move to next card after swipe
      setCurrentIndex(prev => prev + 1);
    } catch (err) {
      console.error("Swipe failed completely:", err);
    }
  };
  
  
  const handleRestart = () => {
    setCurrentIndex(0);
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSelectAll = () => setSelectedTags([...allTags]);
  const handleClearAll = () => setSelectedTags([]);

  const toggleView = () => {
    setIsGrid(prev => {
      const next = !prev;
      if (!next) setCurrentIndex(0);
      return next;
    });
  };

  const toggleMode = (mode) => {
    setSearchMode(mode);
    setUserQuery("");
    setUserResults([]);
  };

  const handleUserSearch = async (value) => {
    const query = value.replace("@", "");
    setUserQuery(value);
    if (query.length < 2) return setUserResults([]);

    try {
      const res = await axios.get(`${API_URL}/profile/search/users?q=${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserResults(res.data);
    } catch (err) {
      console.error("User search failed:", err);
    }
  };

  return (
    <MobileContainer>
      {/* Mode Toggle */}
      <div className="search-toggle">
        <div className="search-toggle-group">
          <button className={`search-toggle-btn ${searchMode === "vehicles" ? "active" : ""}`}
          onClick={() => toggleMode("vehicles")}>
            Vehicles
          </button>
          <button className={`search-toggle-btn ${searchMode === "people" ? "active" : ""}`}
          onClick={() => toggleMode("people")}>
            People
          </button>
        </div>
      </div>

      {/* View Mode Toggle */}
      {searchMode === "vehicles" && (
        <div className="buy-rent-toggle" style={{ marginTop: 4 }}>
          <button onClick={() => setViewMode("buy")} className={viewMode === "buy" ? "active" : ""}>
            Buy
          </button>
          <button className="grid-toggle-btn" onClick={toggleView}>
            <FaThLarge />
          </button>
          <button onClick={() => setViewMode("rent")} className={viewMode === "rent" ? "active" : ""}>
            Rent
          </button>
        </div>
      )}

      {/* PEOPLE SEARCH */}
      {searchMode === "people" ? (
        <div style={{ padding: "10px 14px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={userQuery}
              onChange={(e) => handleUserSearch(e.target.value)}
              placeholder="Search by username..."
              style={{
                flex: 1,
                padding: "12px",
                fontSize: "15px",
                border: "1px solid #ccc",
                borderRadius: "25px",
              }}
            />
          </div>

          {userResults.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px", background: "var(--bg-color)", /* use theme variable */
              color: "var(--text-color)" /* ensure text adapts too */ }}>
              {userResults.map((user) => (
                <div
                  key={user._id}
                  onClick={() => navigate(`/profile/public/${user._id}`)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px",
                    background: "#f9f9f9",
                    borderRadius: "25px",
                    cursor: "pointer",
                    background: "var(--bg-color)", /* use theme variable */
                    color: "var(--text-color)", /* ensure text adapts too */
                    border: "1px solid #bbb"
                  }}
                >
                  <img
                    src={user.profilePic}
                    alt={user.username}
                    style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }}
                  />
                  <div>
                    <div style={{ fontWeight: "bold" }}>{user.username}</div>
                    <div style={{ fontSize: "13px", background: "var(--bg-color)" /* use theme variable */,
  color: "var(--text-color)" /* ensure text adapts too */ }}>{user.firstName} {user.lastName}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : userQuery.length >= 2 ? (
            <p style={{ fontSize: "14px", color: "#777", marginTop: "12px" }}>No users found</p>
          ) : null}
        </div>
      ) : isGrid ? (
        <>
          <GridFilterPanel cars={cars} onFilter={setFilteredCars} onBack={toggleView} />
          {/* view mode */}
          <GridView cars={filterSoldCars(filteredCars)} viewMode={viewMode} />
        </>
      ) : (
        <>
          <div className="swipe-card-container">
            {filteredCars.length === 0 ? (
              <p className="no-more-cards">No more cars to show</p>
            ) : (
              filteredCars.slice(currentIndex, currentIndex + 2).map((car, idx) => (
                <SwipeCard
                  key={car._id}
                  car={car}
                  onSwipe={(dir) => handleSwipe(dir, car)}
                  isTop={idx === 0}
                />
              ))
            )}
          </div>

          <div className="action-buttons">
            <button className="undo-button" onClick={handleRestart}><FaUndo /></button> 
            <button className="fav-button" onClick={() => navigate("/favorites")}><FaHeart /></button>
          </div>

          <div className="tag-section">
            <div className="tag-controls">
              <button onClick={handleSelectAll}>Select All</button>
              <button onClick={handleClearAll}>Clear All</button>
            </div>
            {Object.entries(groupedTags).map(([group, tags]) => (
              <div key={group} className="tag-scroll">
                <span style={{ fontWeight: "bold", fontSize: "13px", whiteSpace: "nowrap" }}>{group}:</span>
                {tags.map(tag => (
                  <button
                    key={tag}
                    className={`tag-pill ${selectedTags.includes(tag) ? "active" : ""}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </MobileContainer>
  );
}
