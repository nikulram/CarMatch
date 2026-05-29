import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { FaCar, FaHeart, FaMapMarkerAlt, FaRegHeart, FaShoppingCart, FaTachometerAlt, FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ARIconButton from "../components/ARIconButton";
import ARViewerModal from "../components/ARViewerModal";
import MobileContainer from "../components/MobileContainer";
import logo from "../images/Vahanalogo.png";
import "./Home.css";

export default function Home() {
  const [cars, setCars] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [cart, setCart] = useState([]);
  const [currentUser, setCurrentUser] = useState({});
  const [viewMode, setViewMode] = useState("buy");
  const [showAR, setShowAR] = useState(false);
  const [arModelUrl, setArModelUrl] = useState("");
  const [showCarStory, setShowCarStory] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  


  const navigate = useNavigate();
  const now = new Date();

  const API_URL = process.env.REACT_APP_API_URL;

  const fetchData = useCallback(async () => {
    await fetchCars();
    await fetchUser();
    await fetchFavorites();
    await fetchCart();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchCars = async () => {
    try {
      const res = await axios.get(`${API_URL}/cars/cars`);
      setCars(res.data);
    } catch (err) {
      console.error("Failed to load cars:", err);
    }
  };

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUser(res.data);
    } catch (err) {
      console.error("Failed to load user:", err);
    }
  };

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites(res.data.favorites || []);
    } catch (err) {
      console.error("Failed to load favorites:", err);
    }
  };

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/profile/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCart(res.data.cart || []);
    } catch (err) {
      console.error("Failed to load cart:", err);
    }
  };

  const toggleFavorite = async (carId) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const isFav = favorites.includes(carId);
    const action = isFav ? "remove" : "add";

    setFavorites((prev) =>
      isFav ? prev.filter((id) => id !== carId) : [...prev, carId]
    );

    try {
      await axios.put(
        `${API_URL}/profile/favorites`,
        { carId, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Favorite toggle error:", err);
    }
  };

  const toggleCart = async (carId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const isInCart = cart.includes(carId);
    const action = isInCart ? "remove" : "add";

    setCart((prev) =>
      isInCart ? prev.filter((id) => id !== carId) : [...prev, carId]
    );

    try {
      await axios.put(
        `${API_URL}/profile/cart`,
        { carId, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Cart toggle error:", err);
    }
  };

  const filteredCars = cars
    .filter((car) =>
      viewMode === "rent" ? car.rentalModeEnabled === true : car.rentalModeEnabled !== true
    )
    .filter((car) =>
      viewMode === "rent"
        ? car.keepListed || !car.isRented
        : !car.sold
    )
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    
  return (
    <MobileContainer>
      <div className="home-container">
        <div className="home-top-bar">
          <h2 className="vahana-logo">
            <img src={logo} alt="Logo" style={{ height: "26px" }} />
          </h2>
          <div className="top-icons">
            <i className="fas fa-bell" onClick={() => navigate("/notification")} />
            <i className="fas fa-comment" onClick={() => navigate("/inbox")} />
          </div>
        </div>

        <div className="buy-rent-toggle">
          <button
            onClick={() => setViewMode("buy")}
            className={viewMode === "buy" ? "active" : ""}
          >
            Buy
          </button>
          <button
            onClick={() => setViewMode("rent")}
            className={viewMode === "rent" ? "active" : ""}
          >
            Rent
          </button>
        </div>

        {["premium", "pro"].includes(currentUser.subscription) && (
          <div className="brand-carousel">
            {filteredCars.slice(0, 10).map((car, index) => (
              <div
                key={car._id}
                className="story-item"
                onClick={() => {
                  setCurrentStoryIndex(index);
                  setCurrentImageIndex(0);
                  setShowCarStory(true);
                }}
              >
                <img
                  src={car.image?.[0]}
                  alt={car.model}
                  className="story-image"
                />
                <p className="story-title">{car.make}</p>
              </div>
            ))}
          </div>
        )}
        
        <div className="car-listings">
          {filteredCars.map((car) => {
            const isUnavailable = car.isRented && car.rentalEnd && new Date(car.rentalEnd) > now;
            const daysLeft = isUnavailable
              ? Math.ceil((new Date(car.rentalEnd) - now) / (1000 * 60 * 60 * 24))
              : 0;

            const isSeller = car?.seller?._id === currentUser?._id;
            const isInCart = cart.includes(car._id);
            const isFav = favorites.includes(car._id);

            return (
              <div
                key={car._id}
                className={`car-card ${isUnavailable ? "greyed-out" : ""}`}
              >
                {isUnavailable && (
                  <div className="ribbon-tag">
                    Available in {daysLeft} day{daysLeft !== 1 ? "s" : ""}
                  </div>
                )}

                <div className="car-image-gallery">
                  {car.image?.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`car-${i}`}
                      className="car-image"
                      style={isUnavailable ? { filter: "grayscale(100%)" } : {}}
                    />
                  ))}

                  {car.supportsAR && car.arModelUrl && (
                    <div className="ar-badge">AR</div>
                  )}

                  <div className={`mode-tag ${car.rentalModeEnabled ? "rent" : "buy"}`}>
                    {car.rentalModeEnabled ? "FOR RENT" : "FOR SALE"}
                  </div>
                </div>

                {!isUnavailable && (
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      alignItems: "flex-end",
                    }}
                  >
                    <button
                      onClick={() => toggleFavorite(car._id)}
                      className={`heart-btn ${isFav ? "liked" : ""}`}
                    >
                      {isFav ? <FaHeart /> : <FaRegHeart />}
                    </button>

                    {!isSeller && (
                      <button
                        onClick={() => toggleCart(car._id)}
                        className={`heart-btn ${isInCart ? "in-cart" : ""}`}
                      >
                        <FaShoppingCart color={isInCart ? "#007bff" : "#444"} />
                      </button>
                    )}

                    <button
                      onClick={() => navigate(`/profile/public/${car.seller._id}`)}
                      className="heart-btn"
                    >
                      <FaUserCircle />
                    </button>

                    {car.supportsAR && car.arModelUrl && (
                      <ARIconButton
                        onClick={() => {
                          setShowAR(true);
                          setArModelUrl(car.arModelUrl);
                        }}
                      />
                    )}
                  </div>
                )}

{car && (
  <div className="car-info">
    <h3>{`${car.year} ${car.make} ${car.model}`}</h3>
    <p className="price">${parseInt(car.price).toLocaleString()}</p>
    <p className="specs">
      <FaTachometerAlt style={{ marginRight: '6px' }} />
      Mileage: {car.mileage !== "N/A" ? `${car.mileage} mi` : "N/A"} <br />
      
      <FaMapMarkerAlt style={{ marginRight: '6px' }} />
      Location: {car.location || "N/A"} <br />
      
      <FaCar style={{ marginRight: '6px' }} />
      Condition: {car.condition || "Unspecified"}
    </p>
  </div>
)}

              </div>
            );
          })}
        </div>
      </div>

      {showAR && (
        <ARViewerModal
          modelUrl={arModelUrl}
          onClose={() => setShowAR(false)}
        />
      )}

      
      {showCarStory && ["premium", "pro"].includes(currentUser.subscription) && (
        <div className="story-modal">
          <button className="close-story" onClick={() => {
            setShowCarStory(false);
            setCurrentImageIndex(0);
          }}>×</button>

          <div className="story-top-bar">
            <div className="story-user">
              <FaUserCircle size={20} />
              <span>{filteredCars[currentStoryIndex]?.seller?.name || "Car Seller"}</span>
            </div>
          </div>

          {/* Main image display */}
          <img
            className="story-main-image"
            src={filteredCars[currentStoryIndex]?.image?.[currentImageIndex]}
            alt={`Car Story ${currentImageIndex + 1}`}
          />

          {/* Caption */}
          <div className="story-caption">
            <h2>{`${filteredCars[currentStoryIndex]?.year} ${filteredCars[currentStoryIndex]?.make} ${filteredCars[currentStoryIndex]?.model}`}</h2>
            <p>{filteredCars[currentStoryIndex]?.description || ""}</p>
          </div>

          {/* Image navigation */}
          <div className="story-nav left" onClick={() => {
            setCurrentImageIndex((prev) => Math.max(prev - 1, 0));
          }}></div>
          <div className="story-nav right" onClick={() => {
            const images = filteredCars[currentStoryIndex]?.image || [];
            setCurrentImageIndex((prev) => Math.min(prev + 1, images.length - 1));
          }}></div>
        </div>
      )}

    </MobileContainer>
  );
}
