// src/pages/admin/VerifyRequestsAdmin.js
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import MobileContainer from "../../components/MobileContainer";
import "./VerifyRequestsAdmin.css";

export default function VerifyRequestsAdmin() {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/verifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVerifications(res.data);
    } catch (err) {
      console.error("Failed to load verifications", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const showPopup = (message) => {
    setPopupMessage(message);
    setTimeout(() => {
      setPopupMessage("");
    }, 3000); // auto hide after 3 sec
  };

  const approveVerification = async (userId, type) => {
    try {
      await axios.post(`${API_URL}/admin/approve-verification`, { userId, type }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showPopup(`${type.charAt(0).toUpperCase() + type.slice(1)} verification approved! `);
      fetchVerifications();
    } catch (err) {
      console.error("Failed to approve", err);
      showPopup("Failed to approve. Please try again.");
    }
  };

  const rejectVerification = async (userId, type) => {
    const reason = prompt("Enter reason for rejection:");
    if (!reason) return;

    try {
      await axios.post(`${API_URL}/admin/reject-verification`, { userId, type, reason }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showPopup(`${type.charAt(0).toUpperCase() + type.slice(1)} verification rejected.`);
      fetchVerifications();
    } catch (err) {
      console.error("Failed to reject", err);
      showPopup("Failed to reject. Please try again.");
    }
  };

  return (
    <MobileContainer>
      <div className="verify-admin-wrapper">
        <div className="verify-admin-header">
          <button className="settings-back" onClick={() => navigate("/admin")}>←</button>
          <h2>Manage Verifications</h2>
        </div>

        {loading ? (
          <p>Loading verifications...</p>
        ) : error ? (
          <p style={{ color: "crimson" }}>Failed to load verification requests. Please try again later.</p>
        ) : (
          <>
            {verifications.length === 0 ? (
              <p>No pending verifications right now.</p>
            ) : (
              <div className="verification-list">
                {verifications.map((user) => (
                  <div key={user._id} className="verification-card">
                    <h3>{user.firstName} {user.lastName}</h3>
                    <p>@{user.username}</p>

                    {user.verification?.buyer?.status === "pending" && (
                      <div className="verify-section">
                        <h4>Buyer Verification</h4>
                        {user.verification.buyer.selfie && (
                          <img src={user.verification.buyer.selfie} alt="Buyer Selfie" className="verify-image" />
                        )}
                        {user.verification.buyer.documents.map((doc, idx) => (
                          <img key={idx} src={doc} alt={`Buyer Document ${idx + 1}`} className="verify-image" />
                        ))}
                        <div className="verify-actions">
                          <button onClick={() => approveVerification(user._id, "buyer")}>Approve</button>
                          <button onClick={() => rejectVerification(user._id, "buyer")}>Reject</button>
                        </div>
                      </div>
                    )}

                    {user.verification?.seller?.status === "pending" && (
                      <div className="verify-section">
                        <h4>Seller Verification</h4>
                        {user.verification.seller.selfie && (
                          <img src={user.verification.seller.selfie} alt="Seller Selfie" className="verify-image" />
                        )}
                        {user.verification.seller.documents.map((doc, idx) => (
                          <img key={idx} src={doc} alt={`Seller Document ${idx + 1}`} className="verify-image" />
                        ))}
                        {user.verification.seller.carDocuments.map((doc, idx) => (
                          <img key={idx} src={doc} alt={`Car Document ${idx + 1}`} className="verify-image" />
                        ))}
                        <div className="verify-actions">
                          <button onClick={() => approveVerification(user._id, "seller")}>Approve</button>
                          <button onClick={() => rejectVerification(user._id, "seller")}>Reject</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {popupMessage && (
          <div className="admin-popup">
            {popupMessage}
          </div>
        )}
      </div>
    </MobileContainer>
  );
}
