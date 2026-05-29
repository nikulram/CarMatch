// src/pages/SalesHistory.js
import { useEffect, useState } from "react";
import axios from "axios";
import MobileContainer from "../components/MobileContainer";
import { IoArrowBack } from "react-icons/io5";
import "./OrderHistory.css";
import { useNavigate } from "react-router-dom";

export default function SalesHistory() {
  const [soldCars, setSoldCars] = useState([]);
  const [rentedCars, setRentedCars] = useState([]);
  const [viewMode, setViewMode] = useState("rentals");
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    fetchSellerHistory();
  }, []);

  const fetchSellerHistory = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const userRes = await axios.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userId = userRes.data._id;

      const carRes = await axios.get(`${API_URL}/cars/cars`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const all = carRes.data;

      const sales = all.filter(
        (car) => car.sold && car?.seller?._id === userId && !car.rentalModeEnabled
      );

      const rentals = all.filter(
        (car) =>
          car.rentalModeEnabled &&
          car?.seller?._id === userId &&
          Array.isArray(car.rentalHistory) &&
          car.rentalHistory.length > 0
      );

      setSoldCars(sales);
      setRentedCars(rentals);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  return (
    <MobileContainer>
      <div className="buy-wrapper">
        <button
          onClick={() => navigate("/profile")}
          style={{ background: "none", border: "none", marginBottom: "10px" }}
        >
          <IoArrowBack size={24} />
        </button>

        <h2 className="buy-title">Rental & Sales History</h2>

        <div style={{ display: "flex", gap: "12px", marginBottom: "14px" }}>
          <button
            onClick={() => setViewMode("rentals")}
            style={{
              flex: 1,
              padding: "10px",
              background: viewMode === "rentals" ? "#000" : "#eee",
              color: viewMode === "rentals" ? "#fff" : "#000",
              fontWeight: "bold",
              borderRadius: "10px",
              border: "none",
            }}
          >
            Rentals Made
          </button>
          <button
            onClick={() => setViewMode("sales")}
            style={{
              flex: 1,
              padding: "10px",
              background: viewMode === "sales" ? "#000" : "#eee",
              color: viewMode === "sales" ? "#fff" : "#000",
              fontWeight: "bold",
              borderRadius: "10px",
              border: "none",
            }}
          >
            Vehicles Sold
          </button>
        </div>

        {viewMode === "rentals" ? (
          rentedCars.length === 0 ? (
            <p style={{ padding: "10px", fontSize: "14px", color: "#777" }}>
              No rental activity yet.
            </p>
          ) : (
            rentedCars.map((car) =>
              car.rentalHistory.map((session, idx) => (
                <div key={car._id + idx} style={{ marginBottom: "24px" }}>
                  <div className="cart-total" style={{ background: "#f0faff" }}>
                    <span>
                      Rented to user #{session.renter.toString().slice(-5)} -{" "}
                      {new Date(session.rentalStart).toLocaleString()} to{" "}
                      {new Date(session.rentalEnd).toLocaleString()}
                    </span>
                    <strong>
                      ${(session.totalPaid + (session.lateFee || 0)).toFixed(2)}
                    </strong>
                  </div>

                  <div className="cart-card">
                    <img
                      src={car.image?.[0]}
                      className="cart-img"
                      alt="car"
                    />
                    <div className="cart-info">
                      <h4>{car.year} {car.make} {car.model}</h4>
                      <p>{car.mileage} mi • {car.location}</p>
                      <p style={{ fontSize: "13px", marginTop: "6px" }}>
                        <strong>Status:</strong> {car.isReturned ? "Returned" : "Active Rental"}
                      </p>
                      {session.lateFee > 0 && (
                        <p style={{ fontSize: "13px", color: "crimson" }}>
                          Late Fee: ${session.lateFee.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )
          )
        ) : (
          soldCars.length === 0 ? (
            <p style={{ padding: "10px", fontSize: "14px", color: "#777" }}>
              No cars sold yet.
            </p>
          ) : (
            soldCars.map((car, i) => (
              <div key={car._id} style={{ marginBottom: "24px" }}>
                <div className="cart-total" style={{ background: "#f6f6f6" }}>
                  <span>Sold #{i + 1}</span>
                  <strong>${car.price.toLocaleString()}</strong>
                </div>

                <div className="cart-card">
                  <img
                    src={car.image?.[0]}
                    className="cart-img"
                    alt="car"
                  />
                  <div className="cart-info">
                    <h4>{car.year} {car.make} {car.model}</h4>
                    <p>{car.mileage} mi • {car.location}</p>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </MobileContainer>
  );
}
