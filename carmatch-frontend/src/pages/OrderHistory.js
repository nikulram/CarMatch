// src/pages/OrderHistory.js
import axios from "axios";
import { useEffect, useState } from "react";
import { IoArrowBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import MobileContainer from "../components/MobileContainer";
import "./OrderHistory.css";

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/orders/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error("Failed to load orders:", err);
    }
  };

  const filteredOrders = orders.filter((order) =>
    order.receiptId.toLowerCase().includes(search.toLowerCase())
  );

  const openInvoice = async (receiptId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API_URL}/api/orders/invoice/${receiptId}`,
        {
          responseType: "blob",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const file = new Blob([res.data], { type: "application/pdf" });
      const fileURL = window.URL.createObjectURL(file);

      if (previewMode) {
        window.open(fileURL, "_blank");
      } else {
        const link = document.createElement("a");
        link.href = fileURL;
        link.download = `Vahana_Receipt_${receiptId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to fetch invoice PDF");
    }
  };

  return (
    <MobileContainer>
      <div className="buy-wrapper">
        <button
          onClick={() => navigate("/profile")}
          style={{ background: "none", border: "none", marginBottom: "10px", color: "var(--text-color)" }}
        >
          <IoArrowBack size={24} />
        </button>

        <h2 className="buy-title">Order History</h2>

        <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
          <input
            placeholder="Search by receipt ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "25px",
              border: "1px solid #bbb",
              fontSize: "14px",
              background: "white",
            }}
          />
          <button
            className="dummy-button"
            onClick={() => setPreviewMode((prev) => !prev)}
            style={{
              padding: "10px 12px",
              fontSize: "12px",
              whiteSpace: "nowrap",
            }}
          >
            {previewMode ? "Preview" : "Download"}
          </button>
        </div>

        {filteredOrders.length === 0 ? (
          <p style={{ padding: "20px", textAlign: "center" }}>
            No matching orders found.
          </p>
        ) : (
          filteredOrders.map((order, i) => {
            const isRental = order.cars.every(car => car.rentalModeEnabled === true);
            const isBuy = order.cars.every(car => !car.rentalModeEnabled);
            const isSubscription = order.isSubscription;

            return (
              <div key={i} style={{ marginBottom: "30px" }}>
                <div className="cart-total" style={{ background: "#f6f6f6" }}>
                  <span>
                    #{order.receiptId} - {new Date(order.date).toLocaleDateString()}
                  </span>
                  <strong>${order.totalPaid.toLocaleString()}</strong>
                </div>

                <div style={{ margin: "5px 0 8px 2px", fontSize: "13px", color: "#007aff" }}>
                  Service:{" "}
                  <strong>
                    {isSubscription
                      ? "Subscription"
                      : isRental
                      ? "Rental"
                      : isBuy
                      ? "Bought"
                      : "Mixed (Rental + Buy)"}
                  </strong>
                </div>

                {isSubscription ? (
                  <div style={{ fontSize: "14px", color: "#555" }}>
                    <strong>Subscription Order</strong>
                  </div>
                ) : (
                  order.cars.map((car, index) => (
                    <div className="cart-card" key={car._id + index}>
                      <img
                        src={car.image?.[0] || "/default-car.png"}
                        className="cart-img"
                        alt="car"
                      />
                      <div className="cart-info">
                        <h4>{car.year} {car.make} {car.model}</h4>
                        <p>${car.price.toLocaleString()}</p>
                        <p className="cart-meta">
                          {car.mileage} mi • {car.location}
                        </p>
                        {car.rentalStart && car.rentalEnd && (
                          <>
                            <p style={{ fontSize: "12px", color: "#555", marginTop: "6px" }}>
                              {new Date(car.rentalStart).toLocaleString()} →{" "}
                              {new Date(car.rentalEnd).toLocaleString()}
                            </p>
                            <p style={{ fontSize: "12px", color: "#333" }}>
                              Status: {car.isReturned ? "Returned" : "Active Rental"}
                            </p>
                            {Array.isArray(car.rentalHistory) &&
                              car.rentalHistory.length > 0 &&
                              car.rentalHistory[0].lateFee > 0 && (
                                <p style={{ fontSize: "12px", color: "crimson" }}>
                                  Late Fee: ${car.rentalHistory[0].lateFee.toFixed(2)}
                                </p>
                              )}
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}

                <button
                  className="add-card-button"
                  onClick={() => openInvoice(order.receiptId)}
                >
                  {previewMode ? "View Invoice" : "Download Invoice"}
                </button>
              </div>
            );
          })
        )}
      </div>
    </MobileContainer>
  );
}
