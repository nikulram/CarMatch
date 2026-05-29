// src/pages/PublicProfile.js
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaCheckCircle, FaStar } from "react-icons/fa";
import axios from "axios";
import MobileContainer from "../components/MobileContainer";
import "./PublicProfile.css";

export default function PublicProfile() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState("all");
  const [myReview, setMyReview] = useState(null);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [canReview, setCanReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const API_URL = process.env.REACT_APP_API_URL;

  const fetchProfile = useCallback(async () => {
    try {
      const [publicRes, privateRes, reviewRes] = await Promise.all([
        axios.get(`${API_URL}/profile/public/${userId}`),
        axios.get(`${API_URL}/profile`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/reviews/user/${userId}`)
      ]);
      setProfile(publicRes.data);
      setCurrentUserId(privateRes.data._id);

      setReviews(reviewRes.data);

      const mine = reviewRes.data.find(r => r.reviewer._id === privateRes.data._id);
      if (mine) {
        setMyReview(mine);
      }

      setCanReview(!mine && privateRes.data._id !== publicRes.data._id);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load public profile:", err);
      setLoading(false);
    }
  }, [userId, token, API_URL]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const filteredReviews = filter === "all"
    ? reviews
    : reviews.filter(r => r.role === filter);

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const handleSubmitReview = async () => {
    if (!newComment.trim()) return;

    try {
      if (myReview) {
        await axios.put(`${API_URL}/reviews/edit/${myReview._id}`, {
          rating: newRating,
          comment: newComment
        }, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API_URL}/reviews/add`, {
          reviewedUserId: profile._id,
          role: "buyer",
          rating: newRating,
          comment: newComment
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
      fetchProfile();
      setNewComment("");
    } catch (err) {
      console.error("Review submit error:", err);
    }
  };

  const handleSendMessage = () => {
    navigate(`/inbox?to=${profile._id}`);
  };

  if (loading) {
    return (
      <MobileContainer>
        <div className="public-profile-wrapper">
          <p>Loading...</p>
        </div>
      </MobileContainer>
    );
  }

  if (!profile) {
    return (
      <MobileContainer>
        <div className="public-profile-wrapper">
          <p>Profile not found.</p>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <div className="public-profile-wrapper">
        <div className="public-header">
          <button onClick={() => navigate(-1)} className="back-btn">
            <FaArrowLeft />
          </button>
          <h2>Public Profile</h2>
        </div>

        <div className="public-profile-card">
          <img
            src={profile.profilePic || "/default-profile.png"}
            alt="Profile"
            className="public-profile-pic"
          />
          <h3 className="public-name">
            {profile.firstName} {profile.lastName}
            {profile.verification?.buyer?.status === "verified" && (
              <FaCheckCircle className="tick-icon" style={{ color: "#3b82f6" }} />
            )}
            {profile.verification?.seller?.status === "verified" && (
              <FaCheckCircle className="tick-icon" style={{ color: "orange" }} />
            )}
          </h3>
          <p className="public-username">@{profile.username}</p>
          {profile.bio && <p className="bio-text">{profile.bio}</p>}

          {currentUserId !== profile._id && (
            <button className="message-btn" onClick={handleSendMessage}>Send Message</button>
          )}
        </div>

        <div className="review-section">
          <h4><FaStar style={{ color: "#FFD700", marginRight: "6px" }} />Ratings & Reviews</h4>

          <div className="review-header">
            <span className="average-rating">{averageRating} / 5</span>
            <div className="filter-buttons">
              <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All</button>
              <button className={filter === "buyer" ? "active" : ""} onClick={() => setFilter("buyer")}>Buyer</button>
              <button className={filter === "seller" ? "active" : ""} onClick={() => setFilter("seller")}>Seller</button>
            </div>
          </div>

          {filteredReviews.length > 0 ? (
            filteredReviews.map((r) => (
              <div key={r._id} className="review-card">
                <div className="review-top">
                  <img src={r.reviewer.profilePic || "/default-profile.png"} alt="Reviewer" />
                  <div className="review-name">
                    {r.reviewer.firstName} {r.reviewer.lastName}
                    {r.reviewer.verification?.buyer?.status === "verified" && (
                      <FaCheckCircle className="small-tick" style={{ color: "#3b82f6" }} />
                    )}
                    {r.reviewer.verification?.seller?.status === "verified" && (
                      <FaCheckCircle className="small-tick" style={{ color: "orange" }} />
                    )}
                  </div>
                </div>
                <div className="review-stars">
                  {Array.from({ length: 5 }, (_, i) => (
                    <FaStar key={i} color={i < r.rating ? "#FFD700" : "#ccc"} />
                  ))}
                </div>
                <p className="review-comment">{r.comment}</p>
                <span className="review-role">{r.role === "buyer" ? "Buyer" : "Seller"}</span>
              </div>
            ))
          ) : (
            <p className="no-reviews">No reviews yet.</p>
          )}
        </div>

        {canReview && (
          <div className="leave-review-section">
            <h4>{myReview ? "Edit Your Review" : "Leave a Review"}</h4>
            <div className="review-stars">
              {Array.from({ length: 5 }, (_, i) => (
                <FaStar
                  key={i}
                  color={i < newRating ? "#FFD700" : "#ccc"}
                  onClick={() => setNewRating(i + 1)}
                  style={{ cursor: "pointer" }}
                />
              ))}
            </div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write your review..."
            ></textarea>
            <button onClick={handleSubmitReview}>
              {myReview ? "Update Review" : "Submit Review"}
            </button>
          </div>
        )}
      </div>
    </MobileContainer>
  );
}
