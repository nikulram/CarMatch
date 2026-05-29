// src/pages/ResetPassword.js
import { useState } from "react";
import axios from "axios";
import "./ResetPassword.css";
import MobileContainer from "../components/MobileContainer";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import VahanaLogo from "../assets/Vahana_Logo.png";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [email] = useState(localStorage.getItem("resetEmail") || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const API_URL = process.env.REACT_APP_API_URL;

  const isStrongPassword = (pwd) =>
    pwd.length >= 8 && /[A-Z]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd);

  const handleReset = async () => {
    setError("");
    setMessage("");

    if (newPassword !== confirm) {
      return setError("Passwords do not match.");
    }

    if (!isStrongPassword(newPassword)) {
      return setError("Must be 8+ chars, include uppercase + special char.");
    }

    try {
      await axios.post(`${API_URL}/auth/reset-password`, {
        email,
        newPassword,
      });

      setMessage("Password changed successfully.");
      localStorage.removeItem("resetEmail");

      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Reset failed.");
    }
  };

  return (
    <MobileContainer>
      <div className="reset-page">
        <div className="top-gradient" />
        <div className="inner-box">
          <div className="back-button" onClick={() => navigate(-1)}>
            <IoArrowBack size={24} />
          </div>
          <div className="logo-wrapper">
            <img src={VahanaLogo} alt="Vahana Logo" className="logo" />
          </div>
          <h2 className="title">Set New Password</h2>
          <div className="form">
            <input
              type={show ? "text" : "password"}
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input"
            />
            <input
              type={show ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input"
            />
            <div className="show-password" onClick={() => setShow((prev) => !prev)}>
              {show ? "Hide Password" : "Show Password"}
            </div>
            {error && <p className="error">{error}</p>}
            {message && <p className="message">{message}</p>}
            <button onClick={handleReset} className="button">
              Reset Password
            </button>
          </div>
        </div>
        <div className="bottom-gradient" />
      </div>
    </MobileContainer>
  );
}
