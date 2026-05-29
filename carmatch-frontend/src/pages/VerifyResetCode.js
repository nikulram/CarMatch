// src/pages/VerifyResetCode.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./VerifyResetCode.css";
import MobileContainer from "../components/MobileContainer";
import { IoArrowBack } from "react-icons/io5";

export default function VerifyResetCode() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const email = localStorage.getItem("resetEmail");
  const API_URL = process.env.REACT_APP_API_URL;

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(`${API_URL}/auth/verify-reset`, { email, code });
      if (res.status === 200) {
        localStorage.setItem("verifiedReset", "true");
        navigate("/reset-password");
      }
    } catch (err) {
      setError("Invalid or expired code.");
    }
  };

  return (
    <MobileContainer>
      <div className="verify-reset-page">
        <div className="top-gradient" />
        <div className="inner-box">
          <div className="back-button" onClick={() => navigate(-1)}>
            <IoArrowBack size={24} />
          </div>
          <h2 className="title">Verify Reset Code</h2>
          <form onSubmit={handleVerify} className="form">
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="input"
            />
            {error && <p className="error-text">{error}</p>}
            <button type="submit" className="button">Verify</button>
          </form>
        </div>
        <div className="bottom-gradient" />
      </div>
    </MobileContainer>
  );
}
