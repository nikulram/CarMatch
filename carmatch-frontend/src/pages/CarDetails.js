import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./CarDetails.css";

export default function CarDetails() {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const API_URL = process.env.REACT_APP_API_URL;

  const fetchCarDetails = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/cars/${id}`);
      setCar(res.data);
    } catch (err) {
      console.error("Failed to load car", err);
    }
  }, [id, API_URL]);

  useEffect(() => {
    fetchCarDetails();
  }, [fetchCarDetails]);

  const handleMessage = () => {
    navigate(`/inbox?contact=${car.sellerId}&carId=${car._id}`);
  };

  const handleProfileView = () => {
    navigate(`/profile/public/${car.sellerId}`);
  };

  const handleARView = () => {
    navigate(`/ar-viewer?carId=${car._id}`);
  };

  if (!car) return <p className="loading">Loading car details...</p>;

  return (
    <div className="details-page">
      <img className="car-image" src={car.image} alt="car" />

      <div className="car-info">
        <h2>{car.year} {car.make} {car.model}</h2>
        <p className="price">${car.price}</p>
        <p>{car.mileage} miles</p>
        <p className="desc">{car.description || "No additional description."}</p>
      </div>

      <div className="action-btns">
        {token && car.sellerId !== localStorage.getItem("userId") && (
          <button onClick={handleMessage}>Contact Seller</button>
        )}
        <button onClick={handleProfileView}>View Seller’s Profile</button>
        <button onClick={handleARView}>View in AR</button>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    </div>
  );
}
