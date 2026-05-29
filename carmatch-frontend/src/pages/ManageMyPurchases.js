// src/pages/ManageMyPurchases.js
import { useEffect, useState } from "react";
import axios from "axios";
import MobileContainer from "../components/MobileContainer";
import "./OrderHistory.css";
import { IoArrowBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

export default function ManageMyPurchases() {
  const [activeRentals, setActiveRentals] = useState([]);
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchActiveRentals();
  }, []);

  const fetchActiveRentals = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/orders/rental-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const allRentals = res.data.rentals || [];
      const now = new Date();
      const uniqueCars = new Map();

      allRentals.forEach((order) => {
        order.cars.forEach((car) => {
          const isActive = car.isRented && new Date(car.rentalEnd) > now;
          if (isActive && !uniqueCars.has(car._id)) {
            uniqueCars.set(car._id, { ...car, receiptId: order.receiptId });
          }
        });
      });

      setActiveRentals(Array.from(uniqueCars.values()));
    } catch (err) {
      console.error("Error fetching rentals:", err);
    }
  };

  const endRentalEarly = async (carId) => {
    try {
      await axios.put(`${API_URL}/cars/return/${carId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchActiveRentals();
    } catch (err) {
      alert("Failed to end rental early.");
    }
  };

  return (
    <MobileContainer>
      <div className="buy-wrapper">
        <button
          onClick={() => navigate("/dashboard")}
          style={{ background: "none", border: "none", marginBottom: "10px" }}
        >
          <IoArrowBack size={24} />
        </button>

        <h2 className="buy-title">Manage My Purchases</h2>

        {activeRentals.length === 0 ? (
          <p style={{ padding: "20px", textAlign: "center" }}>
            You have no active Purchases.
          </p>
        ) : (
          activeRentals.map((car) => {
            const now = new Date();
            const rentalEnd = new Date(car.rentalEnd);
            const rentalStart = new Date(car.rentalStart);

            const isOverdue = now > rentalEnd;
            const hoursLate = isOverdue ? Math.ceil((now - rentalEnd) / (1000 * 60 * 60)) : 0;
            const lateFee = isOverdue ? Math.ceil(hoursLate * (car.price * 0.1)) : 0;

            return (
              <div key={car._id} style={{ marginBottom: "30px" }}>
                <div className="cart-total" style={{ background: "#f6f6f6" }}>
                  <span>{car.year} {car.make} {car.model}</span>
                  <strong>${car.price}/day</strong>
                </div>

                <div className="cart-card">
                  <img src={car.image[0]} className="cart-img" alt="rented" />
                  <div className="cart-info">
                    <p className="cart-meta">{car.mileage} mi • {car.location}</p>
                    <p style={{ fontSize: "13px", marginTop: "6px" }}>
                      Rental Period: {rentalStart.toLocaleDateString()} → {rentalEnd.toLocaleDateString()}
                    </p>

                    {isOverdue ? (
                      <p style={{ color: "#cc0000", fontSize: "13px", marginTop: 6 }}>
                        Overdue by {hoursLate} hour{hoursLate > 1 ? "s" : ""} - Late Fee: ${lateFee}
                      </p>
                    ) : (
                      <p style={{ color: "#007aff", fontSize: "13px", marginTop: 6 }}>
                        Time Left: {Math.ceil((rentalEnd - now) / (1000 * 60 * 60))} hour(s)
                      </p>
                    )}

                    <button
                      className="add-card-button"
                      onClick={() => endRentalEarly(car._id)}
                      style={{ marginTop: "10px" }}
                    >
                      End Rental Early
                    </button>

                    <p style={{ fontSize: "11px", color: "#777", marginTop: "6px" }}>
                      *No refund for early checkout. Car becomes instantly available.
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </MobileContainer>
  );
}
