import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MobileContainer from "../components/MobileContainer";
import "./Notifications.css";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [carDetailsMap, setCarDetailsMap] = useState({}); // carId -> car data
  const API_URL = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem("token");
  const fallbackPic =
    "/default-profile.png";
  // Fetch Notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);

      // After fetching notifications, fetch car details
      for (const notif of res.data) {
        // Assuming the link has carId embedded in it, e.g., "/car-details/:carId"
        const length = (notif.link?.split("/")).length; 
        const carIdFromLink = (notif.link?.split("/"))[length-1]; // Extract carId from the URL

        if (carIdFromLink && !carDetailsMap[carIdFromLink]) {
          try {
            const carRes = await axios.get(`${API_URL}/cars/${carIdFromLink}`, {
              headers: { Authorization: `Bearer ${token}` },
            });

            // Store car details in the map
            setCarDetailsMap((prev) => ({
              ...prev,
              [carIdFromLink]: carRes.data,
            }));
          } catch (carErr) {
            console.error(`Error fetching car ${carIdFromLink}:`, carErr);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching notifications", err);
    } finally {
      setLoading(false);
    }
  }, [API_URL, token, carDetailsMap]);

  const markAsSeen = async (id) => {
    try {
      await axios.patch(
        `${API_URL}/notifications/${id}/seen`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, seen: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as seen", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <MobileContainer>
      <div className="notifications-container">
        <h2 className="text-xl font-semibold mb-4">Notifications</h2>

        {loading ? (
          <p>Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p>No notifications.</p>
        ) : (
          <div className="notifications-list">
            {notifications.map((notif) => {
              const carIdFromLink = notif.link?.split("/")[2];
              const carDetails = carIdFromLink
                ? carDetailsMap[carIdFromLink]
                : null;

              return (
                <div key={notif._id} className="notification-item">
                  {/* Car Image */}
                  {carDetails?.image?.[0] && (
                    <div style={{ position: "relative" }}>
                      <img
                        src={carDetails.image[0]}
                        alt="Car"
                        className="car-image"
                      />
                      {/* SOLD Badge */}
                      {notif.message.toLowerCase().includes("sold") && (
                        <div className="sold-badge">SOLD</div>
                      )}
                    </div>
                  )}

                {carDetails && (
                      <div className="car-info">
                        <div className="car-name">{carDetails.year + ' ' + carDetails.make + " " + carDetails.model}</div>
                        <div className="car-price">${carDetails.price}</div>
                        <div className="car-location">
                          <i className="fas fa-map-marker-alt" style={{ marginRight: "5px" }}></i>
                          {carDetails.location || "Location unknown"}
                        </div>
                      </div>
                    )}

                  {/* Message Section */}
                  <div className="notification-message-section">
                    {/* Avatar */}
                    <img
                      src={notif.sender?.profilePic || fallbackPic}
                      alt="Avatar"
                      className="notification-avatar"
                    />
                    {/* Details */}
                    <div className="notification-details">
                    <div className="notification-title">
                      {notif.sender
                        ? `${notif.sender.firstName || ''} ${notif.sender.lastName || ''}`.trim()
                        : "Notification"}
                    </div>

                    <div className="notification-subtext">
                      {notif.type === "message" && notif.message
                        ? notif.message
                        : notif.message}
                    </div>

                      {/* Timestamp */}
                      <div className="notification-time">
                        {new Date(notif.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Notification Type Box */}
                  <div className="notification-type-box">
                    {notif.type === ("message") && (
                      <Link
                      to={`/inbox?to=${notif.sender._id || notif.sender}`}
                        onClick={() => markAsSeen(notif._id)}
                        className="notification-button"
                      >
                        Reply
                      </Link>
                    )}

                    {notif.message.includes("sold") && (
                      <>
                        <i className="fas fa-tag"></i> An item has been sold
                      </>
                    )}
                    {notif.message.includes("rented") && (
                      <>
                        <i className="fas fa-check-circle"></i> Transaction
                        Complete
                      </>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="notification-actions">
              
                    {notif.message.includes("rented") && (
                      <>
                        <Link
                          to={notif.link || "#"}
                          onClick={() => markAsSeen(notif._id)}
                          className="notification-button"
                        >
                          View Details
                        </Link>
                        <Link to="#" className="notification-button secondary">
                          Contact Buyer
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MobileContainer>
  );
}
