import { useEffect, useState } from "react";
import axios from "axios";
import "./GridView.css";
import { FaHeart, FaRegHeart, FaShoppingCart, FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ARIconButton from "./ARIconButton";
import ARViewerModal from "./ARViewerModal";

const BASE_URL = process.env.REACT_APP_API_URL;

export default function GridView({ cars, viewMode }) {
  const [favorites, setFavorites] = useState([]);
  const [cart, setCart] = useState([]);
  const [currentUser, setCurrentUser] = useState({});
  const [showAR, setShowAR] = useState(false);
  const [arModelUrl, setArModelUrl] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
    fetchFavorites();
    fetchCart();
  }, []);

  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.get(`${BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUser(res.data);
    } catch (err) {
      console.error("Failed to load user:", err);
    }
  };

  const fetchFavorites = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.get(`${BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites(res.data.favorites || []);
    } catch (err) {
      console.error("Failed to load favorites:", err);
    }
  };

  const fetchCart = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.get(`${BASE_URL}/profile/cart`, {
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
        `${BASE_URL}/profile/favorites`,
        { carId, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Failed to update favorites:", err);
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
        `${BASE_URL}/profile/cart`,
        { carId, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Failed to update cart:", err);
    }
  };

  const filteredCars = cars
    .filter((car) =>
      viewMode === "rent" ? car.rentalModeEnabled === true : car.rentalModeEnabled !== true
    )
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <div className="grid-view">
      {filteredCars.length === 0 ? (
        <p className="no-results-text">No cars found</p>
      ) : (
        filteredCars.map((car) => {
          const isSeller = car?.seller?._id === currentUser?._id;
          const isInCart = cart.includes(car._id);
          const isFav = favorites.includes(car._id);
          const isUnavailable = car.isRented;

          return (
            <div
              className={`grid-card ${isUnavailable ? "greyed-out" : ""}`}
              key={car._id}
            >
              <div style={{ position: "relative" }}>
                {isUnavailable && car.rentalEnd && (
                  <div className="ribbon-tag">
                    Unavailable until {new Date(car.rentalEnd).toLocaleDateString()}
                  </div>
                )}

                <img
                  src={car.image?.[0]}
                  alt={`${car.make} ${car.model}`}
                  style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 8 }}
                />

                {car.supportsAR && car.arModelUrl && (
                  <div className="ar-badge">AR</div>
                )}
              </div>

              <div className="grid-info">
                <h4>{car.year} • {car.make} {car.model}</h4>
                <p>
                  ${car.price.toLocaleString()} •{" "}
                  {car.mileage !== "N/A" ? `${car.mileage} mi` : "N/A mi"}
                </p>
              </div>

              {!isUnavailable && (
                <div className="grid-icons">
                  <button className="fav-btn" onClick={() => toggleFavorite(car._id)}>
                    {isFav ? <FaHeart color="#ff4757" /> : <FaRegHeart />}
                  </button>

                  {!isSeller && (
                    <button
                      className={`fav-btn ${isInCart ? "in-cart" : ""}`}
                      onClick={() => toggleCart(car._id)}
                    >
                      <FaShoppingCart />
                    </button>
                  )}

                  <button
                    className="fav-btn"
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
              )}
            </div>
          );
        })
      )}

      {showAR && (
        <ARViewerModal
          modelUrl={arModelUrl}
          onClose={() => setShowAR(false)}
        />
      )}
    </div>
  );
}
