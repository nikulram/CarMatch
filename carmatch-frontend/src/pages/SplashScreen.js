import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import "./SplashScreen.css";
import MobileContainer from "../components/MobileContainer";
import splashAnimation from "../animations/SplashScreenAnimation.json"; // adjust path based on your file location

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const seenSplash = localStorage.getItem("seenSplash");
    if (seenSplash) {
      navigate("/onboarding");
    } else {
      const timer = setTimeout(() => {
        localStorage.setItem("seenSplash", "true");
        navigate("/onboarding");
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [navigate]);

  return (
    <MobileContainer>
      <div className="splash-container">
        <Lottie animationData={splashAnimation} loop={true} className="splash-animation" />
      </div>
    </MobileContainer>
  );
}
