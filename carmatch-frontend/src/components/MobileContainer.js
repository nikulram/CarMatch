// src/components/MobileContainer.js
import React from "react";
import "./MobileContainer.css";
import BottomNav from "./BottomNav";
import { useLocation } from "react-router-dom";

export default function MobileContainer({ children }) {
  const location = useLocation();
  const hideNavOn = [
    "/", "/onboarding", "/login", "/register", "/verify",
    "/forgot-password", "/verify-reset", "/reset-password"
  ];

  const showNav = !hideNavOn.includes(location.pathname);

  return (
    <div className="mobile-frame">
      <div className="mobile-inner">
      <div className={`mobile-content ${showNav ? 'mobile-content-with-padding' : ''}`}>
        {children}
      </div>
        {showNav && <BottomNav />}
      </div>
    </div>
  );
}
