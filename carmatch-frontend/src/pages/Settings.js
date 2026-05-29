// src/pages/Settings.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileContainer from "../components/MobileContainer";
import "./Settings.css";

export default function Settings() {
  const navigate = useNavigate();
  const themes = ["light", "dark"];
  const [currentTheme, setCurrentTheme] = useState("light");

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setCurrentTheme(savedTheme);
    document.body.setAttribute("data-theme", savedTheme);
  }, []);

  const changeTheme = (theme) => {
    setCurrentTheme(theme);
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  };

  const handleVerificationClick = () => {
    navigate("/verification");
  };

  return (
    <MobileContainer>
      <div className="settings-wrapper">
        <div className="settings-top">
          <button className="settings-back" onClick={() => navigate("/profile")}>←</button>
          <h2>Settings</h2>
        </div>

        <div className="settings-buttons">
          {/* Theme Switcher */}
          {themes.map((theme) => (
            <button
              key={theme}
              className={theme === currentTheme ? "active-theme" : ""}
              onClick={() => changeTheme(theme)}
            >
              {theme.charAt(0).toUpperCase() + theme.slice(1)}
            </button>
          ))}

          {/*Verification Button */}
          <button
            className="verification-button"
            onClick={handleVerificationClick}
          >
            Manage Verification
          </button>
        </div>

        <p className="settings-footer">Theme: {currentTheme}</p>
      </div>
    </MobileContainer>
  );
}
