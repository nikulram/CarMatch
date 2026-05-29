import { useEffect, useState } from "react";
import axios from "axios";
import MobileContainer from "../components/MobileContainer";
import PopupModal from "../components/PopupModal";
import "./Buy.css";
import { FaTrash, FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function Buy() {
  const [cartCars, setCartCars] = useState([]);
  const [user, setUser] = useState(null);
  const [showVerifyPopup, setShowVerifyPopup] = useState(false);
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    fetchUserAndCart();
  }, []);

  const fetchUserAndCart = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const userRes = await axios.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(userRes.data);

      const cartRes = await axios.get(`${API_URL}/profile/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const allCarsRes = await axios.get(`${API_URL}/cars/cars`);

      const cartList = allCarsRes.data.filter(
        (car) =>
          cartRes.data.cart.includes(car._id) &&
          car?.seller?._id !== userRes.data._id &&
          !car.sold &&
          (!car.rentalModeEnabled || !car.isRented)
      );

      setCartCars(cartList);
    } catch (err) {
      console.error("Error loading cart:", err);
    }
  };

  const removeFromCart = async (carId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.put(
        `${API_URL}/profile/cart`,
        { carId, action: "remove" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCartCars((prev) => prev.filter((c) => c._id !== carId));
    } catch (err) {
      console.error("Error removing from cart:", err);
    }
  };

  const totalPrice = cartCars.reduce(
    (sum, car) => sum + parseFloat(car.price || 0),
    0
  );

  const proceedToCheckout = () => {
    if (!user) return;

    if (user.verification?.buyer?.status !== "verified") {
      setShowVerifyPopup(true);
      return;
    }

    navigate("/checkout");
  };

  return (
    <MobileContainer>
      <div className="buy-wrapper">
        <div className="buy-scrollable">
          <h2 className="buy-title">Your Cart</h2>

          {cartCars.length === 0 ? (
            <p className="empty-msg">Your cart is empty. Start exploring cars!</p>
          ) : (
            <>
              <div className="cart-list">
                {cartCars.map((car) => (
                  <div className="cart-card" key={car._id}>
                    <img src={car.image[0]} alt="car" className="cart-img" />

                    <div className="cart-info">
                      <h4>{car.year} {car.make} {car.model}</h4>
                      <p>${parseFloat(car.price).toLocaleString()}</p>
                      <p className="cart-meta">
                        {car.mileage} mi • {car.location}
                      </p>
                    </div>

                    <div className="cart-actions">
                      <button onClick={() => removeFromCart(car._id)}>
                        <FaTrash />
                      </button>
                      <button onClick={() => navigate(`/profile/public/${car.seller._id}`)}>
                        <FaUserCircle />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-total">
                <span>Total:</span>
                <strong>${totalPrice.toLocaleString()}</strong>
              </div>
            </>
          )}
        </div>
        {cartCars.length > 0 && (
          <div className="checkout-fixed">
            <button className="checkout-btn" onClick={proceedToCheckout}>
              Proceed to Checkout
            </button>
          </div>
        )}

        {/* Popup Modal for Verification */}
        <PopupModal
          visible={showVerifyPopup}
          message="You must complete Buyer Verification before checkout."
          onClose={() => setShowVerifyPopup(false)}
          onGoVerify={() => navigate("/verification")}
        />
      </div>
    </MobileContainer>
  );
}
