// src/pages/ThankYou.js
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ThankYou.css";
import MobileContainer from "../components/MobileContainer";

export default function ThankYou() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/order-history");
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate]); //included navigate in dependency array

  return (
    <MobileContainer>
      <div className="thankyou-wrapper">
        <div className="confetti" />
        <h1>Purchase Successful!</h1>
        <p>Thank you for choosing Vahana.</p>
        <p>Your receipt has been sent to your email.</p>
        <button onClick={() => navigate("/order-history")}>
          View Order History
        </button>
      </div>
    </MobileContainer>
  );
}
