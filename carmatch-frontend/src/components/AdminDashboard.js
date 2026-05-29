import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [cars, setCars] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchCars();
      fetchMessages();
    }
  }, [isAdmin]);

  const checkAdmin = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.role !== "admin") {
        alert("Access Denied: Admins Only");
        navigate("/");
      } else {
        setIsAdmin(true);
      }
    } catch (err) {
      console.error("Error verifying admin role:", err);
      navigate("/");
    }
  };

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const fetchCars = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`${API_URL}/admin/cars`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCars(res.data);
    } catch (err) {
      console.error("Error fetching cars:", err);
    }
  };

  const fetchMessages = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`${API_URL}/admin/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  return isAdmin ? (
    <div>
      <h2>Admin Dashboard</h2>

      <div>
        <h3>Users</h3>
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

      <div>
        <h3>Car Listings</h3>
        {cars.length === 0 ? (
          <p>No cars found.</p>
        ) : (
          <ul>
            {cars.map((car) => (
              <li key={car._id}>
                {car.year} {car.make} {car.model} - ${car.price}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3>Messages</h3>
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
    </div>
  ) : (
    <p>Loading...</p>
  );
}
