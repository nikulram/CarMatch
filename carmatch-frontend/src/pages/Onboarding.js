import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Onboarding.css";
import Welcome1 from "../images/Welcome1.png";
import Welcome2 from "../images/Welcome2.png";
import Welcome3 from "../images/Welcome3.png";
import MobileContainer from "../components/MobileContainer";

const slides = [
  {
    images: [Welcome1],
    title: (
      <>
        Welcome to <br />
        <span className="vahana-highlight">Vahana</span>
      </>
    ),
    text: "The last car app you’ll ever need",
  },
  {
    images: [Welcome2],
    title: "3-D Imaging ",
    text: "Upload a 3D version of your car and experience it in Virtual Reality - a unique feature exclusive to Vahana",
  },
  {
    images: [Welcome3],
    title: "Verified Listings & Users",
    text: "Feel safe with our verified users and cars, ensuring a trustworthy platform for all transactions",
  },
];

export default function Onboarding() {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const startX = useRef(null);
  const endX = useRef(null);

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    endX.current = e.changedTouches[0].clientX;
    handleSwipe();
  };

  const handleMouseDown = (e) => {
    startX.current = e.clientX;
  };

  const handleMouseUp = (e) => {
    endX.current = e.clientX;
    handleSwipe();
  };

  const handleSwipe = () => {
    const distance = startX.current - endX.current;
    if (distance > 50) {
      nextSlide();
    } else if (distance < -50) {
      prevSlide();
    }
  };

  const nextSlide = () => {
    if (index < slides.length - 1) {
      setIndex(index + 1);
    } else {
      localStorage.setItem("seenOnboarding", "true");
      navigate("/home");
    }
  };

  const prevSlide = () => {
    if (index > 0) {
      setIndex(index - 1);
    }
  };

  return (
    <MobileContainer>
      <div
        className="onboarding-container"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        style={{ cursor: "grab" }}
      >
        <div className="onboarding-content">
          <img
            src={slides[index].images[0]}
            alt="onboarding visual"
            className="onboarding-image"
            draggable={false}
          />
          <h2>{slides[index].title}</h2>
          <p>{slides[index].text}</p>
        </div>

        <div className="onboarding-dots">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`onboarding-dot ${i === index ? "active" : ""}`}
            />
          ))}
        </div>
      </div>
    </MobileContainer>
  );
}
