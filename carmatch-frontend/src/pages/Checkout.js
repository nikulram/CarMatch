// src/pages/Checkout.js
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import MobileContainer from "../components/MobileContainer";
import PopupModal from "../components/PopupModal";
import "./Wallet.css";
import "./Checkout.css";
import { IoArrowBack } from "react-icons/io5";

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [rentalDates, setRentalDates] = useState({});
  const [rentalTimes, setRentalTimes] = useState({});
  const [balance, setBalance] = useState(0);
  const [activeCard, setActiveCard] = useState(null);
  const [method, setMethod] = useState("vahana");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [showVerifyPopup, setShowVerifyPopup] = useState(false);
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("token");

    const [cartRes, allCarsRes, userRes] = await Promise.all([
      axios.get(`${API_URL}/profile/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get(`${API_URL}/cars/cars`),
      axios.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const cartCars = allCarsRes.data.filter(
      (car) =>
        cartRes.data.cart.includes(car._id) &&
        car?.seller?._id !== userRes.data._id &&
        !car.sold &&
        (!car.rentalModeEnabled || !car.isRented)
    );

    setCart(cartCars);
    setBalance(userRes.data.walletBalance);
    const active = userRes.data.savedCards.find((c) => c.isActive);
    setActiveCard(active);
    setUser(userRes.data);
  };

  const handleDateChange = (carId, type, value) => {
    setRentalDates((prev) => ({
      ...prev,
      [carId]: {
        ...prev[carId],
        [type]: value,
      },
    }));
  };

  const handleTimeChange = (carId, type, value) => {
    setRentalTimes((prev) => ({
      ...prev,
      [carId]: {
        ...prev[carId],
        [type]: value,
      },
    }));
  };

  const isTimeValid = (time) => {
    if (!time) return false;
    const [hour] = time.split(":").map(Number);
    return hour >= 9 && hour <= 17;
  };

  const baseTotal = cart.reduce((sum, car) => {
    if (car.rentalModeEnabled) {
      const dates = rentalDates[car._id];
      if (!dates?.start || !dates?.end) return sum;
      const start = new Date(dates.start);
      const end = new Date(dates.end);
      const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
      return sum + Number(car.price) * days;
    }
    return sum + Number(car.price);
  }, 0);

  const fee = Math.round(baseTotal * 0.05);
  const finalTotal = baseTotal + fee;

  const payNow = async () => {
    setError("");

    if (!method) return setError("Please select a payment method.");
    if (cart.length === 0) return setError("Cart is empty.");
    if (method === "vahana" && balance < finalTotal)
      return setError("Insufficient Vahana Cash balance.");

    for (let car of cart) {
      if (car.rentalModeEnabled) {
        const dates = rentalDates[car._id];
        const times = rentalTimes[car._id];
        if (!dates?.start || !dates?.end || !times?.start || !times?.end) {
          return setError(`Please select date and time for ${car.make} ${car.model}.`);
        }

        if (!isTimeValid(times.start) || !isTimeValid(times.end)) {
          return setError(`Allowed rental hours are 9 AM to 5 PM.`);
        }

        const startDateTime = new Date(`${dates.start}T${times.start}`);
        const endDateTime = new Date(`${dates.end}T${times.end}`);
        if (startDateTime >= endDateTime) {
          return setError(`End must be after start for ${car.make} ${car.model}.`);
        }
      }
    }

    if (!user) return;

    if (user.verification?.buyer?.status !== "verified") {
      setShowVerifyPopup(true);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const combinedRentalDates = {};
      cart.forEach((car) => {
        if (car.rentalModeEnabled) {
          const dates = rentalDates[car._id];
          const times = rentalTimes[car._id];
          combinedRentalDates[car._id] = {
            start: `${dates.start}T${times.start}`,
            end: `${dates.end}T${times.end}`,
          };
        }
      });

      await axios.post(
        `${API_URL}/api/orders/checkout`,
        {
          selectedCars: cart.map((c) => c._id),
          rentalDates: combinedRentalDates,
          method,
          total: finalTotal,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      navigate("/thankyou");
    } catch (err) {
      console.error("Checkout error", err);
      setError(err.response?.data?.error || "Checkout failed.");
    }
  };

  return (
    <MobileContainer>
      <div className="checkout-wrapper">
        <div className="checkout-scrollable">
          <button
            onClick={() => navigate("/buy")}
            style={{ background: "none", border: "none", marginBottom: "10px", marginTop: "10px", paddingLeft: "8px", color: "var(--text-color)" }}
          >
            <IoArrowBack size={24} />
          </button>

          <h2 className="checkout-title">Checkout</h2>

          {cart.map((car) => (
            <div className="checkout-car-card" key={car._id}>
              <img src={car.image[0]} alt="car" className="checkout-img" />
              <div>
                <h3>
                  {car.year} {car.make} {car.model}{" "}
                  <span style={{ fontSize: "12px", color: "#999" }}>
                    [{car.rentalModeEnabled ? "RENT" : "BUY"}]
                  </span>
                </h3>
                <p>${car.price} {car.rentalModeEnabled && "/ day"}</p>
                <p>{car.location}</p>

                {car.rentalModeEnabled && (
                  <div style={{ marginTop: 6 }}>
                    <label style={{ fontSize: "13px" }}>Rental Start Date:</label>
                    <input
                      type="date"
                      onChange={(e) => handleDateChange(car._id, "start", e.target.value)}
                      value={rentalDates[car._id]?.start || ""}
                    />
                    <label style={{ fontSize: "13px", marginTop: 6 }}>Start Time (9 AM - 5 PM):</label>
                    <input
                      type="time"
                      onChange={(e) => handleTimeChange(car._id, "start", e.target.value)}
                      value={rentalTimes[car._id]?.start || ""}
                    />

                    <label style={{ fontSize: "13px", marginTop: 6 }}>Rental End Date:</label>
                    <input
                      type="date"
                      onChange={(e) => handleDateChange(car._id, "end", e.target.value)}
                      value={rentalDates[car._id]?.end || ""}
                    />
                    <label style={{ fontSize: "13px", marginTop: 6 }}>End Time (9 AM - 5 PM):</label>
                    <input
                      type="time"
                      onChange={(e) => handleTimeChange(car._id, "end", e.target.value)}
                      value={rentalTimes[car._id]?.end || ""}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="cart-total"><span>Base Total:</span><strong>${baseTotal.toLocaleString()}</strong></div>
          <div className="cart-total"><span>Vahana Fee (5%):</span><strong>${fee.toLocaleString()}</strong></div>
          <div className="cart-total"><span>Final Total:</span><strong>${finalTotal.toLocaleString()}</strong></div>

          <div className="cart-total"><span>Payment Method:</span></div>
          <div className="bottom-actions">
            <button className={method === "vahana" ? "add-card-button" : "dummy-button"} onClick={() => setMethod("vahana")}>
              Vahana Cash (${balance.toLocaleString()})
            </button>
            {activeCard && (
              <button className={method === "card" ? "add-card-button" : "dummy-button"} onClick={() => setMethod("card")}>
                **** {activeCard.cardNumber.slice(-4)} - {activeCard.expiry}
              </button>
            )}
          </div>

          {error && <p className="wallet-msg" style={{ color: "red", marginTop: "12px" }}>{error}</p>}
        </div>

        <div className="checkout-fixed">
          <button className="checkout-btn" onClick={payNow}>
            Pay ${finalTotal.toLocaleString()}
          </button>
        </div>

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
