import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import MobileContainer from "../components/MobileContainer";
import "./EditProfile.css";

export default function EditProfile() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    gender: "Prefer not to say",
    bio: "",
    profilePic: "",
  });

  const [preview, setPreview] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const API_URL = process.env.REACT_APP_API_URL;

  const fetchProfile = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFormData({
        firstName: res.data.firstName || "",
        lastName: res.data.lastName || "",
        username: res.data.username || "",
        email: res.data.email || "",
        gender: res.data.gender || "Prefer not to say",
        bio: res.data.bio || "",
        profilePic: res.data.profilePic || "",
      });
      setPreview(res.data.profilePic);
    } catch (err) {
      console.error("Failed to load profile:", err);
    }
  }, [token, API_URL]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "username" && value.length > 15) return;
    if (name === "bio" && value.length > 300) return;

    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    try {
      let uploadedUrl = formData.profilePic;

      if (file) {
        const data = new FormData();
        data.append("profilePic", file);

        const res = await axios.post(`${API_URL}/profile/upload`, data, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });

        uploadedUrl = res.data.url;
      }

      await axios.put(
        `${API_URL}/profile`,
        { ...formData, profilePic: uploadedUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage("Profile updated successfully");
      setTimeout(() => navigate("/profile"), 1500);
    } catch (err) {
      const error = err.response?.data?.error || "Update failed";
      setMessage(error);
    }
  };

  return (
    <MobileContainer>
      <div className="edit-container">
        <div className="edit-header">
          <button className="back-btn" onClick={() => navigate("/profile")}>←</button>
          <h2>Edit Profile</h2>
          <button className="save-btn" onClick={handleSave}>Save</button>
        </div>

        {message && <div className="onscreen-message">{message}</div>}

        <div className="edit-image-section" onClick={handleImageClick}>
          <img
            src={preview || "/default-profile.png"}
            alt="Profile"
          />
          <p>Tap to change photo</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>

        <div className="edit-form">
          <input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" />
          <input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name" />
          <input name="username" value={formData.username} onChange={handleChange} placeholder="Username (max 15)" />
          <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" />

          <select name="gender" value={formData.gender} onChange={handleChange}>
            <option>Male</option>
            <option>Female</option>
            <option>Non-binary</option>
            <option>Prefer not to say</option>
            <option>Other</option>
          </select>

          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            maxLength={300}
            placeholder="Bio (max 300 characters)"
          />
          <p className="char-count">{formData.bio.length}/300</p>
        </div>
      </div>
    </MobileContainer>
  );
}
