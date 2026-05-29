import { useEffect, useState } from "react";
import axios from "axios";
import MobileContainer from "../components/MobileContainer";
import PopupModal from "../components/PopupModal";
import "./RentCar.css";

const API_URL = process.env.REACT_APP_API_URL;

const usStates = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

const sortedTypes = [
  "ATV", "Bicycle", "Camper Van / RV", "Car (Standard)", "Convertible", "Crossover",
  "Cruiser Bike", "Dirt Bike", "Electric Bicycle (E-Bike)", "Electric Car (EV)", "Electric Scooter (E-Scooter)",
  "Go-Kart", "Golf Cart", "Hatchback", "Hybrid Car", "Jeep", "Luxury Car", "Minivan", "Moped",
  "Motorbike / Motorcycle", "Off-Road Vehicle", "Pickup Truck", "Scooter", "Sedan", "Sports Bike",
  "Sports Car", "Station Wagon", "Touring Bike", "Truck (Heavy Duty)", "Truck (Light Duty)", "Van",
  "Custom Vehicle"
].sort();

export default function RentCar() {
  const [formData, setFormData] = useState({
    type: "car",
    customType: "",
    make: "",
    model: "",
    year: "",
    mileage: "",
    rentalPricePerDay: "",
    description: "",
    city: "",
    state: "",
    condition: "New",
    supportsAR: false,
    arModel: null,
    keepListed: true
  });

  const [images, setImages] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [user, setUser] = useState(null);
  const [showVerifyPopup, setShowVerifyPopup] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (err) {
      console.error("Failed to fetch user", err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    setError("");
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    const newImages = [...images, ...selected].slice(0, 10);
    setImages(newImages);
    setError("");
  };

  const handleARModelChange = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith(".glb")) {
      setFormData(prev => ({ ...prev, arModel: file }));
    } else {
      setError("Only .glb 3D model files are supported.");
    }
  };

  const handleImageClick = (file) => {
    const url = URL.createObjectURL(file);
    setPreviewImage({ file, url });
  };

  const removeImage = (targetFile) => {
    setImages((prev) => prev.filter((img) => img !== targetFile));
    setPreviewImage(null);
  };

  const validateImages = () => {
    if (images.length < 5) return "Please upload at least 5 images.";
    if (images.length > 10) return "You can upload up to 10 images.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!user) return;

    if (user.verification?.seller?.status !== "verified") {
      setShowVerifyPopup(true);
      return;
    }

    const imgError = validateImages();
    if (imgError) return setError(imgError);
    if (!formData.city || !formData.state) return setError("Please enter city and select state.");
    if (!formData.rentalPricePerDay) return setError("Please enter rental price per day.");

    const form = new FormData();
    const typeToSend = formData.type === "Custom Vehicle" ? formData.customType : formData.type;
    const mileageToSend = formData.mileage === "" ? "N/A" : formData.mileage;

    form.append("type", typeToSend);
    form.append("make", formData.make);
    form.append("model", formData.model);
    form.append("year", formData.year);
    form.append("price", formData.rentalPricePerDay);
    form.append("mileage", mileageToSend);
    form.append("description", formData.description);
    form.append("location", `${formData.city}, ${formData.state}`);
    form.append("condition", formData.condition);
    form.append("rentalModeEnabled", true);
    form.append("keepListed", formData.keepListed);
    form.append("supportsAR", formData.supportsAR);

    if (formData.supportsAR && formData.arModel) {
      form.append("arModel", formData.arModel);
    }

    images.forEach((img) => form.append("images", img));

    try {
      await axios.post(`${API_URL}/cars/sell`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage("Vehicle listed for rent successfully!");
      setImages([]);
      setFormData({
        type: "car", customType: "", make: "", model: "", year: "",
        mileage: "", rentalPricePerDay: "", description: "",
        city: "", state: "", condition: "New", supportsAR: false,
        arModel: null, keepListed: true
      });

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch {
      setError("Failed to list rental vehicle.");
    }
  };

  return (
    <MobileContainer>
      <div className="rentcar-container">
        <h2>Rent Out Your Vehicle</h2>
        <form className="rentcar-form" onSubmit={handleSubmit}>
          <select name="type" value={formData.type} onChange={handleChange}>
            {sortedTypes.map((type, idx) => (
              <option key={idx} value={type}>{type}</option>
            ))}
          </select>

          {formData.type === "Custom Vehicle" && (
            <input
              name="customType"
              value={formData.customType}
              onChange={handleChange}
              placeholder="Enter custom type"
              required
            />
          )}

          <input name="make" placeholder="Make" value={formData.make} onChange={handleChange} required />
          <input name="model" placeholder="Model" value={formData.model} onChange={handleChange} required />
          <input name="year" placeholder="Year" value={formData.year} onChange={handleChange} required />
          <input name="mileage" placeholder="Mileage (optional)" value={formData.mileage} onChange={handleChange} />
          <input name="rentalPricePerDay" placeholder="Rental Price Per Day ($)" value={formData.rentalPricePerDay} onChange={handleChange} required />
          <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} />
          <input name="city" placeholder="City" value={formData.city} onChange={handleChange} required />

          <select name="state" value={formData.state} onChange={handleChange} required>
            <option value="">Select State</option>
            {usStates.map((st, idx) => (
              <option key={idx} value={st}>{st}</option>
            ))}
          </select>

          <select name="condition" value={formData.condition} onChange={handleChange} required>
            <option value="New">New</option>
            <option value="Used">Used</option>
            <option value="Other">Other</option>
          </select>

          <label className="ar-toggle-label">
            <input
              type="checkbox"
              name="supportsAR"
              checked={formData.supportsAR}
              onChange={handleChange}
            />
            Enable AR mode (upload .glb 3D model)
          </label>

          {formData.supportsAR && (
            <input
              type="file"
              accept=".glb"
              onChange={handleARModelChange}
              required
            />
          )}

          <label className="rentcar-checkbox-label">
            <input
              type="checkbox"
              name="keepListed"
              checked={formData.keepListed}
              onChange={handleChange}
            />
            Keep this vehicle listed after rental ends
          </label>

          <div className="image-upload-area">
            <label>Add 5 required images (Main, Front, Back, Left, Right). Max 10 total.</label>
            <div className="upload-buttons">
              <label className="custom-file-btn">
                Add Images
                <input type="file" multiple accept="image/*" onChange={handleFileChange} hidden />
              </label>
            </div>

            <div className="image-preview-grid">
              {images.map((img, idx) => (
                <div key={idx} className="img-preview-item">
                  <img src={URL.createObjectURL(img)} alt={`img-${idx}`} onClick={() => handleImageClick(img)} />
                  <button className="delete-btn" onClick={() => removeImage(img)}>×</button>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}
          {message && <p className="success-text">{message}</p>}
          <button type="submit">Submit Rental Listing</button>
        </form>

        {previewImage && (
          <div className="image-overlay">
            <img src={previewImage.url} alt="Preview" />
            <button className="close-btn" onClick={() => setPreviewImage(null)}>×</button>
          </div>
        )}

        {/* Popup Modal for Verification */}
        <PopupModal
          visible={showVerifyPopup}
          message="You must complete Seller Verification before renting out a vehicle."
          onClose={() => setShowVerifyPopup(false)}
          onGoVerify={() => window.location.href = "/verification"}
        />
      </div>
    </MobileContainer>
  );
}
