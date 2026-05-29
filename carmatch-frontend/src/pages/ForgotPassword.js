// src/pages/ForgotPassword.js
import { useState } from "react";
import axios from "axios";
import "./ForgotPassword.css";
import MobileContainer from "../components/MobileContainer";
import { useNavigate } from "react-router-dom";
import VahanaLogo from "../assets/Vahana_Logo.png";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setMessage(res.data.message);
      localStorage.setItem("resetEmail", email);
      setTimeout(() => navigate("/verify-reset"), 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send reset code.");
    }
  };

  return (
    <MobileContainer>
      <div className="forgot-page">
        <div className="top-gradient" />
        <div className="inner-box">
          <div className="logo-wrapper">
            <img src={VahanaLogo} alt="Vahana Logo" className="logo" />
          </div>
          <h2 className="title">Forgot Password</h2>
          <p className="subtitle">Enter your email and we'll send you a reset code</p>
          <form onSubmit={handleSubmit} className="form">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input"
            />
            {error && <p className="error">{error}</p>}
            {message && <p className="success">{message}</p>}
            <button type="submit" className="button">Send Code</button>
          </form>
        </div>
        <div className="bottom-gradient" />
      </div>
    </MobileContainer>
  );
}
