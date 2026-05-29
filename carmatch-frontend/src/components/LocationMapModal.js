// LocationMapModal.js
import React, { useEffect, useRef, useState, useCallback } from "react";
import "./LocationMapModal.css";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

export default function LocationMapModal({ onClose, onSelect }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [address, setAddress] = useState("Loading location...");

  const reverseGeocode = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      );
      const data = await res.json();
      setAddress(data.display_name || "Unnamed location");
    } catch {
      setAddress("Unknown location");
    }
  };

  const initializeMap = useCallback((coords) => {
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map("leaflet-map").setView(coords, 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

    const marker = L.marker(coords, { draggable: true }).addTo(map);
    marker.on("dragend", (e) => {
      const { lat, lng } = e.target.getLatLng();
      reverseGeocode(lat, lng);
    });

    markerRef.current = marker;
    mapRef.current = map;

    reverseGeocode(coords[0], coords[1]);
  }, []);

  useEffect(() => {
    const defaultCoords = [42.6864, -73.8236]; // UAlbany

    if (!navigator.geolocation) {
      console.warn("Geolocation not supported.");
      initializeMap(defaultCoords);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const userCoords = [coords.latitude, coords.longitude];
        initializeMap(userCoords);
      },
      (error) => {
        console.error("Geolocation error:", error.code, error.message);
        initializeMap(defaultCoords);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [initializeMap]); // ESLint-safe

  const handleConfirm = () => {
    onSelect(address);
    onClose();
  };

  return (
    <div className="map-modal-wrapper">
      <div className="map-modal-box">
        <div id="leaflet-map" className="leaflet-map-container"></div>
        <div className="map-bottom-bar">
          <div className="map-address-text">{address}</div>
          <div className="map-buttons">
            <button className="map-cancel" onClick={onClose}>
              Cancel
            </button>
            <button className="map-confirm" onClick={handleConfirm}>
              Use This Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
