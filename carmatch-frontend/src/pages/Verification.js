import { useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import axios from "axios";
import MobileContainer from "../components/MobileContainer";
import "./Verification.css";

export default function Verification() {
  const [buyerSelfie, setBuyerSelfie] = useState(null);
  const [buyerDocs, setBuyerDocs] = useState([]);
  const [sellerSelfie, setSellerSelfie] = useState(null);
  const [sellerDocs, setSellerDocs] = useState([]);
  const [carDocs, setCarDocs] = useState([]);
  const [uploadingBuyer, setUploadingBuyer] = useState(false);
  const [uploadingSeller, setUploadingSeller] = useState(false);
  const [buyerMessage, setBuyerMessage] = useState("");
  const [buyerError, setBuyerError] = useState("");
  const [sellerMessage, setSellerMessage] = useState("");
  const [sellerError, setSellerError] = useState("");

  const token = localStorage.getItem("token");
  const API_URL = process.env.REACT_APP_API_URL;

  const removeSelfie = (type) => {
    if (type === "buyer") setBuyerSelfie(null);
    if (type === "seller") setSellerSelfie(null);
  };

  const removeFile = (index, type) => {
    if (type === "buyer") {
      setBuyerDocs(prev => prev.filter((_, i) => i !== index));
    } else if (type === "seller") {
      setSellerDocs(prev => prev.filter((_, i) => i !== index));
    } else if (type === "car") {
      setCarDocs(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleBuyerSubmit = async (e) => {
    e.preventDefault();
    setBuyerError("");
    setBuyerMessage("");

    if (!buyerSelfie && buyerDocs.length === 0) {
      setBuyerError("Please upload at least a Buyer Selfie or ID Document.");
      return;
    }

    setUploadingBuyer(true);

    try {
      const formData = new FormData();
      if (buyerSelfie) formData.append("buyerSelfie", buyerSelfie);
      buyerDocs.forEach(doc => formData.append("buyerDocs", doc));

      await axios.post(`${API_URL}/verify/submit-verification`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setBuyerMessage("Buyer verification submitted successfully!");
      setBuyerSelfie(null);
      setBuyerDocs([]);
    } catch (err) {
      console.error("Buyer verification submit error:", err);
      setBuyerError(err.response?.data?.error || "Failed to submit Buyer verification. Please try again later.");
    } finally {
      setUploadingBuyer(false);
    }
  };

  const handleSellerSubmit = async (e) => {
    e.preventDefault();
    setSellerError("");
    setSellerMessage("");

    if (!sellerSelfie && sellerDocs.length === 0 && carDocs.length === 0) {
      setSellerError("Please upload at least a Seller Selfie, Seller Document, or Car Document.");
      return;
    }

    setUploadingSeller(true);

    try {
      const formData = new FormData();
      if (sellerSelfie) formData.append("sellerSelfie", sellerSelfie);
      sellerDocs.forEach(doc => formData.append("sellerDocs", doc));
      carDocs.forEach(doc => formData.append("carDocs", doc));

      await axios.post(`${API_URL}/verify/submit-verification`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setSellerMessage("Seller verification submitted successfully!");
      setSellerSelfie(null);
      setSellerDocs([]);
      setCarDocs([]);
    } catch (err) {
      console.error("Seller verification submit error:", err);
      setSellerError(err.response?.data?.error || "Failed to submit Seller verification. Please try again later.");
    } finally {
      setUploadingSeller(false);
    }
  };

  return (
    <MobileContainer>
      <div className="verification-page">
        <h2 className="page-title">Verification</h2>

        {/* Buyer Verification */}
        <form className="verification-form" onSubmit={handleBuyerSubmit}>
          <div className="verify-section">
            <h3>Buyer Verification</h3>

            <label>Upload Live Selfie (Buyer)</label>
            <div className="upload-box">
              <input type="file" accept="image/*" onChange={(e) => setBuyerSelfie(e.target.files[0])} />
            </div>
            {buyerSelfie && (
              <div className="uploaded-file">
                <span>{buyerSelfie.name}</span>
                <button type="button" onClick={() => removeSelfie("buyer")} className="delete-button">
                  <FiTrash2 />
                </button>
              </div>
            )}

            <label>Upload ID Document(s) (Buyer)</label>
            <div className="upload-box">
              <input type="file" accept="image/*" multiple onChange={(e) => setBuyerDocs(Array.from(e.target.files))} />
            </div>
            {buyerDocs.length > 0 && (
              <div className="uploaded-files">
                {buyerDocs.map((file, idx) => (
                  <div key={idx} className="uploaded-file">
                    <span>{file.name}</span>
                    <button type="button" onClick={() => removeFile(idx, "buyer")} className="delete-button">
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button type="submit" disabled={uploadingBuyer}>
              {uploadingBuyer ? "Uploading Buyer Documents..." : "Submit Buyer Verification"}
            </button>

            {buyerMessage && <p className="success-text">{buyerMessage}</p>}
            {buyerError && <p className="error-text">{buyerError}</p>}
          </div>
        </form>

        {/* Seller Verification */}
        <form className="verification-form" onSubmit={handleSellerSubmit}>
          <div className="verify-section">
            <h3>Seller Verification</h3>

            <label>Upload Live Selfie (Seller)</label>
            <div className="upload-box">
              <input type="file" accept="image/*" onChange={(e) => setSellerSelfie(e.target.files[0])} />
            </div>
            {sellerSelfie && (
              <div className="uploaded-file">
                <span>{sellerSelfie.name}</span>
                <button type="button" onClick={() => removeSelfie("seller")} className="delete-button">
                  <FiTrash2 />
                </button>
              </div>
            )}

            <label>Upload ID Document(s) (Seller)</label>
            <div className="upload-box">
              <input type="file" accept="image/*" multiple onChange={(e) => setSellerDocs(Array.from(e.target.files))} />
            </div>
            {sellerDocs.length > 0 && (
              <div className="uploaded-files">
                {sellerDocs.map((file, idx) => (
                  <div key={idx} className="uploaded-file">
                    <span>{file.name}</span>
                    <button type="button" onClick={() => removeFile(idx, "seller")} className="delete-button">
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label>Upload Car Ownership Document(s)</label>
            <div className="upload-box">
              <input type="file" accept="image/*" multiple onChange={(e) => setCarDocs(Array.from(e.target.files))} />
            </div>
            {carDocs.length > 0 && (
              <div className="uploaded-files">
                {carDocs.map((file, idx) => (
                  <div key={idx} className="uploaded-file">
                    <span>{file.name}</span>
                    <button type="button" onClick={() => removeFile(idx, "car")} className="delete-button">
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button type="submit" disabled={uploadingSeller}>
              {uploadingSeller ? "Uploading Seller Documents..." : "Submit Seller Verification"}
            </button>

            {sellerMessage && <p className="success-text">{sellerMessage}</p>}
            {sellerError && <p className="error-text">{sellerError}</p>}
          </div>
        </form>
      </div>
    </MobileContainer>
  );
}
