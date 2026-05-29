import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaTags } from "react-icons/fa";
import {
  FaAt,
  FaCarSide,
  FaChartBar,
  FaCheckCircle,
  FaCrown,
  FaHistory,
  FaStar,
  FaUser,
  FaVenus,
  FaWallet
} from "react-icons/fa";
import { FiShare2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import MobileContainer from "../components/MobileContainer";
import "./Profile.css";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [verifyPopup, setVerifyPopup] = useState("");
  const dropdownRef = useRef();
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL;

  const fetchProfile = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (err) {
      console.error("Failed to load profile", err);
    }
  }, [token, API_URL]);

  useEffect(() => {
    fetchProfile();
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [fetchProfile]);

  const handleClickOutside = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setDropdownOpen(false);
    }
    if (!e.target.classList.contains("tick-icon")) {
      setVerifyPopup("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleShare = () => {
    const profileLink = `${window.location.origin}/profile/public/${user._id}`;
    navigator.clipboard.writeText(profileLink);
    alert("Profile link copied!");
  };

  const handleVerificationClick = () => {
    navigate("/verification");
  };

  const handleAdminDashboardClick = () => {
    navigate("/admin");
  };

  return (
    <MobileContainer>
      <div className="profile-container">
        <div className="profile-header">
          <h2>My Profile</h2>
          <div className="menu-wrapper" ref={dropdownRef}>
            <button className="menu-button" onClick={() => setDropdownOpen(!dropdownOpen)}>⋮</button>
            {dropdownOpen && (
              <div className="dropdown-menu">
                <div onClick={() => navigate("/settings")}>Settings</div>
                <div onClick={handleVerificationClick}>Verification</div>
                {user?.role === "admin" && (
                  <div onClick={handleAdminDashboardClick}>Admin Dashboard</div>
                )}
                <div onClick={handleLogout}>Logout</div>
              </div>
            )}
          </div>
        </div>

        {user && (
          <>
            <div className="profile-card">
              <img
                src={user.profilePic || "/default-profile.png"}
                alt="Profile"
              />
              <h3 className="profile-name">
                {user.firstName} {user.lastName}
                
                {user.verification?.buyer?.status === "verified" && (
                  <FaCheckCircle
                    className="tick-icon"
                    style={{ color: "#3b82f6" }}
                    onClick={(e) => { e.stopPropagation(); setVerifyPopup("Verified Buyer"); }}
                  />
                )}
                {user.verification?.seller?.status === "verified" && (
                  <FaCheckCircle
                    className="tick-icon"
                    style={{ color: "orange" }}
                    onClick={(e) => { e.stopPropagation(); setVerifyPopup("Verified Seller"); }}
                  />
                )}

                <FiShare2 className="share-name-icon" onClick={handleShare} />
              </h3>

              <div className="profile-badges">
                <span className="badge badge-username">
                  <FaAt style={{ marginRight: "4px" }} />
                  {user.username}
                </span>
              </div>

              {user.bio && (
                <p style={{ marginTop: "8px", fontStyle: "italic", fontSize: "14px", color: "#71758A" }}>
                  {user.bio}
                </p>
              )}

              <div className="profile-buttons">
                <button onClick={() => navigate("/edit-profile")}>Edit Profile</button>
              </div>
            </div>

            {verifyPopup && (
              <div className="verify-popup">{verifyPopup}</div>
            )}

            <div className="profile-actions-grid">
              <button onClick={() => navigate("/dashboard")}>
                <span className="icon-circle dashboard-icon"><FaChartBar /></span>
                Dashboard
              </button>

              <button onClick={() => navigate(`/profile/public/${user._id}`)}>
                <span className="icon-circle public-profile-icon"><FaUser /></span>
                Public Profile
              </button>

              <button onClick={() => navigate("/wallet")}>
                <span className="icon-circle wallet-icon"><FaWallet /></span>
                Wallet
              </button>

              <button onClick={() => navigate("/order-history")}>
                <span className="icon-circle orders-icon"><FaHistory /></span>
                Orders
              </button>

              <button onClick={() => navigate("/sales-history")}>
                <span className="icon-circle salesrentals-icon"><FaTags /></span>
                Sales | Rentals
              </button>

              <button onClick={() => navigate("/subscription")}>
                <span className="icon-circle subscriptions-icon"><FaStar /></span>
                Subscriptions
              </button>
            </div>
          </>
        )}
      </div>
    </MobileContainer>
  );
}
