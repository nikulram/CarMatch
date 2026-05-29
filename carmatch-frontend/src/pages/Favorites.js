import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./Favorites.css";
import MobileContainer from "../components/MobileContainer";
import ARIconButton from "../components/ARIconButton";
import ARViewerModal from "../components/ARViewerModal";
import { FaTrash, FaChevronLeft, FaShoppingCart, FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function Favorites() {
  const [cars, setCars] = useState([]);
  const [cart, setCart] = useState([]);
  const [currentUser, setCurrentUser] = useState({});
  const [viewMode, setViewMode] = useState("buy");
  const [showAR, setShowAR] = useState(false);
  const [arModelUrl, setArModelUrl] = useState("");
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL;

  const fetchData = useCallback(async () => {
    await fetchUser();
    await fetchCart();
    await fetchFavorites();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUser(res.data);
    } catch (err) {
      console.error("Error loading user:", err);
    }
  };

  const fetchCart = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.get(`${API_URL}/profile/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCart(res.data.cart || []);
    } catch (err) {
      console.error("Error loading cart:", err);
    }
  };

  const fetchFavorites = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const profileRes = await axios.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const favoriteIds = profileRes.data.favorites || [];
      if (favoriteIds.length === 0) return setCars([]);

      const carRes = await axios.get(`${API_URL}/cars/cars`);
      const allCars = carRes.data;

      const filtered = allCars.filter(
        (car) => favoriteIds.includes(car._id) && !car.sold
      );

      setCars(filtered);
    } catch (err) {
      console.error("Error loading favorites:", err);
    }
  };

  const removeFavorite = async (carId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.put(
        `${API_URL}/profile/favorites`,
        { carId, action: "remove" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCars((prev) => prev.filter((c) => c._id !== carId));
    } catch (err) {
      console.error("Error removing favorite:", err);
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
      console.error("Error updating cart:", err);
    }
  };

  const now = new Date();
  const filteredCars = cars.filter((car) =>
    viewMode === "buy" ? !car.rentalModeEnabled : car.rentalModeEnabled
  );

  return (
    <MobileContainer>
      <div className="fav-container">
        <div className="fav-top">
          <button className="fav-back-btn" onClick={() => navigate("/search")}>
            <FaChevronLeft />
          </button>
          <h2>Favorites</h2>
        </div>

        <div className="fav-toggle">
          <div className="fav-toggle-group">
            <button
              className={viewMode === "buy" ? "active" : ""}
              onClick={() => setViewMode("buy")}
            >
              Buy
            </button>
            <button
              className={viewMode === "rent" ? "active" : ""}
              onClick={() => setViewMode("rent")}
            >
              Rent
            </button>
          </div>
        </div>

        {filteredCars.length === 0 ? (
          <p>No {viewMode} favorites yet.</p>
        ) : (
          <div className="fav-grid">
            {filteredCars.map((car) => {
              const isSeller = car?.seller?._id === currentUser?._id;
              const isInCart = cart.includes(car._id);
              const isUnavailable = car.isRented && new Date(car.rentalEnd) > now;
              const daysLeft = isUnavailable
                ? Math.ceil((new Date(car.rentalEnd) - now) / (1000 * 60 * 60 * 24))
                : null;

              return (
                <div
                  key={car._id}
                  className={`fav-card ${isUnavailable ? "greyed-out" : ""}`}
                >
                  <div style={{ position: "relative" }}>
                    <img
                      src={car.image[0]}
                      alt={`${car.make}`}
                      style={isUnavailable ? { filter: "grayscale(100%)" } : {}}
                    />
                    {isUnavailable && (
                      <div className="ribbon-tag">
                        Available in {daysLeft} day{daysLeft > 1 ? "s" : ""}
                      </div>
                    )}
                    {car.supportsAR && car.arModelUrl && (
                      <div className="ar-badge">AR</div>
                    )}
                  </div>

                  <div className="fav-info-carType">
                    <h4 style={{ fontSize: "20px" }}>
                      {car.year} {car.make} {car.model}
                    </h4>
                    <div className="fav-info">
                      <p
                        style={{
                          color: "#2563EB",
                          fontSize: "20px",
                          fontStyle: "bold",
                        }}
                      >
                        ${car.price}
                      </p>
                      <p>{car.mileage} mi</p>
                    </div>
                    <div className="fav-info">
                      <p>{car.location}</p>
                    </div>
                  </div>

                  <div className="fav-buttons">
                    <button
                      className="remove-btn"
                      onClick={() => removeFavorite(car._id)}
                      style={{ color: "red" }}
                    >
                      <FaTrash />
                    </button>

                    {!isSeller && !isUnavailable && (
                      <button
                        className={`remove-btn ${isInCart ? "in-cart" : ""}`}
                        onClick={() => toggleCart(car._id)}
                      >
                        <FaShoppingCart />
                      </button>
                    )}

                    <button
                      className="remove-btn"
                      onClick={() => navigate(`/profile/public/${car.seller._id}`)}
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
                </div>
              );
            })}
          </div>
        )}

        {showAR && (
          <ARViewerModal
            modelUrl={arModelUrl}
            onClose={() => setShowAR(false)}
          />
        )}
      </div>
    </MobileContainer>
  );
}
