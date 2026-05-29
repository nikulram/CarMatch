// src/pages/AdminDashboard.js
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import MobileContainer from "../components/MobileContainer";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [cars, setCars] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const API_URL = process.env.REACT_APP_API_URL;

  const fetchAdminData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.role !== "admin") {
        alert("Access denied: Admins only.");
        navigate("/home");
        return;
      }

      const [usersRes, carsRes, messagesRes] = await Promise.allSettled([
        axios.get(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/admin/cars`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/admin/messages`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (usersRes.status === "fulfilled") setUsers(usersRes.value.data);
      if (carsRes.status === "fulfilled") setCars(carsRes.value.data);
      if (messagesRes.status === "fulfilled") setMessages(messagesRes.value.data);

      setLoading(false);

    } catch (err) {
      console.error("Admin dashboard error:", err);
      alert("Error loading Admin data.");
      navigate("/home");
    }
  }, [navigate, token, API_URL]);

  useEffect(() => {
    if (token) {
      fetchAdminData();
    } else {
      navigate("/login");
    }
  }, [fetchAdminData, token, navigate]);

  const deleteCarAsAdmin = async (carId) => {
    if (!window.confirm("Delete this listing?")) return;
    try {
      await axios.delete(`${API_URL}/cars/admin/delete/${carId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCars(prev => prev.filter((car) => car._id !== carId));
    } catch (err) {
      console.error("Failed to delete car:", err);
      alert("Failed to delete listing. Please try again.");
    }
  };

  if (loading) {
    return (
      <MobileContainer>
        <div className="admin-page">
          <p>Checking Admin Status...</p>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <div className="admin-page">
        <h2 className="admin-title">Admin Dashboard</h2>

        {/* Tabs */}
        <div className="admin-tabs">
          <button onClick={() => setActiveTab("users")} className={activeTab === "users" ? "tab-active" : ""}>Users</button>
          <button onClick={() => setActiveTab("cars")} className={activeTab === "cars" ? "tab-active" : ""}>Car Listings</button>
          <button onClick={() => setActiveTab("messages")} className={activeTab === "messages" ? "tab-active" : ""}>Messages</button>
          <button onClick={() => navigate("/admin/verification-requests")} className="tab-manage">Manage Verifications</button>
        </div>

        {/* Tab Content */}
        {activeTab === "users" && (
          <div className="admin-section">
            <h3>All Users</h3>
            {users.length === 0 ? (
              <p>No users found.</p>
            ) : (
              <ul>
                {users.map((user) => (
                  <li key={user._id}>
                    {user.firstName} {user.lastName} - {user.email}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === "cars" && (
          <div className="admin-section">
            <h3>All Car Listings</h3>
            {cars.length === 0 ? (
              <p>No car listings found.</p>
            ) : (
              <ul>
                {cars.map((car) => (
                  <li key={car._id}>
                    {car.year} {car.make} {car.model} - ${car.price}
                    <button className="delete-btn" onClick={() => deleteCarAsAdmin(car._id)}>Delete</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === "messages" && (
          <div className="admin-section">
            <h3>All Messages</h3>
            {messages.length === 0 ? (
              <p>No messages found.</p>
            ) : (
              <ul>
                {messages.map((msg) => (
                  <li key={msg._id}>
                    {msg.sender?.firstName || "Unknown"}: {msg.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </MobileContainer>
  );
}
