// components/ARViewerModal.js
import React, { useState, useEffect } from 'react';
import '@google/model-viewer';
import './ARViewerModal.css';

export default function ARViewerModal({ modelUrl, onClose }) {
  const [bgColor, setBgColor] = useState('#f4f4f4');
  const backgroundOptions = ['#f4f4f4', '#999999', '#000000'];

  // Scroll lock on open and unlock on close
  useEffect(() => {
    document.body.style.overflow = "hidden"; // Lock background scroll
    return () => {
      document.body.style.overflow = "auto"; // Restore scroll on close
    };
  }, []);

  return (
    <div className="ar-modal-overlay">
      <div className="ar-modal-container">
        <div className="ar-top-bar">
          <button className="ar-close-button" onClick={onClose}>X</button>

          <div className="ar-bg-selector">
            {backgroundOptions.map((color) => (
              <button
                key={color}
                style={{ backgroundColor: color }}
                className={`ar-bg-button ${bgColor === color ? 'active' : ''}`}
                onClick={() => setBgColor(color)}
              ></button>
            ))}
          </div>
        </div>

        <model-viewer
          src={modelUrl}
          alt="3D Vehicle Model"
          ar
          ar-modes="scene-viewer quick-look webxr"
          auto-rotate
          camera-controls
          shadow-intensity="1"
          exposure="1"
          style={{ backgroundColor: bgColor }}
        ></model-viewer>
      </div>
    </div>
  );
}
