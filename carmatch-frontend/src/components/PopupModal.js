// src/components/PopupModal.js
import "./PopupModal.css";

export default function PopupModal({ message, visible, onClose, onGoVerify }) {
  if (!visible) return null;

  return (
    <div className="popup-modal-overlay">
      <div className="popup-modal-container">
        <p className="popup-message">{message}</p>
        <div className="popup-buttons">
          <button className="popup-verify-button" onClick={onGoVerify}>
            Go to Verification
          </button>
          <button className="popup-close-button" onClick={onClose}>
            X
          </button>
        </div>
      </div>
    </div>
  );
}
