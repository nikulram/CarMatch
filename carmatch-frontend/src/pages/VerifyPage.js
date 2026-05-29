// src/pages/VerifyPage.js
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileContainer from "../components/MobileContainer";

export default function VerifyPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const email = localStorage.getItem("emailForVerification");

  const API_URL = process.env.REACT_APP_API_URL;

  const handleVerify = async () => {
    try {
      const res = await axios.post(`${API_URL}/auth/verify-code`, {
        email,
        code,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.removeItem("emailForVerification");
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.error || "Verification failed.");
    }
  };

  return (
    <MobileContainer>
      <div style={{ padding: 24, marginTop: 60 }}>
        <h2 style={{ marginBottom: 20 }}>Enter the 6-digit code</h2>
        <input
          type="text"
          placeholder="Enter code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "16px",
            fontSize: "16px",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        />
        {error && <p style={{ color: "crimson", marginBottom: 12 }}>{error}</p>}
        <button
          onClick={handleVerify}
          style={{
            width: "100%",
            padding: "14px",
            background: "#222",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Verify & Continue
        </button>
      </div>
    </MobileContainer>
  );
}
