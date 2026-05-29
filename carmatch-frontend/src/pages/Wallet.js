import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import MobileContainer from "../components/MobileContainer";
import "./Wallet.css";
import { IoArrowForward, IoArrowBack } from "react-icons/io5";

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [promoCode, setPromoCode] = useState("");
  const [message, setMessage] = useState("");
  const [savedCards, setSavedCards] = useState([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardForm, setCardForm] = useState({
    cardNumber: "",
    nameOnCard: "",
    expiry: "",
    cvv: "",
    address: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBalance(res.data.walletBalance);
      setSavedCards(res.data.savedCards || []);
    } catch (err) {
      console.error("Failed to load wallet", err);
    }
  };

  const applyPromo = async () => {
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/profile/wallet/promo`,
        { code: promoCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBalance(res.data.walletBalance);
      setPromoCode("");
      setMessage("Promo code applied!");
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to apply promo.");
    }
  };

  const addCard = async () => {
    const { cardNumber, nameOnCard, expiry, cvv, address } = cardForm;
    if (!cardNumber || !nameOnCard || !expiry || !cvv || !address) {
      return setMessage("Fill in all fields.");
    }
    if (cardNumber.replace(/\s/g, "").length !== 16) {
      return setMessage("Card number must be 16 digits.");
    }
    if (cvv.length !== 3) {
      return setMessage("CVV must be 3 digits.");
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/profile/wallet/card`,
        cardForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSavedCards(res.data.savedCards);
      setCardForm({ cardNumber: "", nameOnCard: "", expiry: "", cvv: "", address: "" });
      setShowAddCard(false);
      setMessage("Card added.");
    } catch (err) {
      setMessage(err.response?.data?.error || "Card save failed.");
    }
  };

  const deleteCard = async (index) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete(
        `${process.env.REACT_APP_API_URL}/profile/wallet/card/${index}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSavedCards(res.data.savedCards);
    } catch (err) {
      setMessage("Failed to delete card.");
    }
  };

  const activateCard = async (index) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/profile/wallet/card/activate`,
        { index },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSavedCards(res.data.savedCards);
    } catch (err) {
      console.error(err);
    }
  };

  const formatCardNumber = (input) => {
    return input.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (input) => {
    let cleaned = input.replace(/\D/g, "");
    if (cleaned.length >= 3) {
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  return (
    <MobileContainer>
      <div className="wallet-container">
        <button
          onClick={() => navigate("/profile")}
          style={{ background: "none", border: "none", marginBottom: "10px" }}
        >
          <IoArrowBack size={24} style={{ color: "var(--text-color)" }} />
        </button>

        <h1 className="wallet-title">Vahana Cash</h1>

        <div className="wallet-balance">
          <h5>Available Balance</h5>
          <h3>${balance.toLocaleString()}</h3>
          <div className="balance-actions">
            <button onClick={applyPromo}>Add Money</button>
            <button disabled>Transfer</button>
          </div>
        </div>

        <input
          type="text"
          placeholder="Enter promo or test code"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            marginTop: "12px",
            fontSize: "14px",
          }}
        />

        <div className="section-title">Payment Methods</div>
        {savedCards.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No cards saved yet.</p>
        ) : (
          savedCards.map((card, index) => (
            <div key={index} className={`card-box ${card.isActive ? "active" : ""}`}>
              <div className="card-details">
                <strong>**** **** **** {card.cardNumber.slice(-4)}</strong>
                <span className="card-meta">Expires {card.expiry}</span>
              </div>
              <div className="card-buttons">
                {!card.isActive && (
                  <button onClick={() => activateCard(index)}>Make Default</button>
                )}
                <button onClick={() => deleteCard(index)}>Delete</button>
              </div>
            </div>
          ))
        )}

        {!showAddCard && (
          <div className="add-card-box" onClick={() => setShowAddCard(true)}>
            <p>Add Credit/Debit Card</p>
          </div>
        )}

        {showAddCard && (
          <div className="add-card-form">
            <input
              placeholder="Card Number"
              value={cardForm.cardNumber}
              maxLength="19"
              onChange={(e) =>
                setCardForm({ ...cardForm, cardNumber: formatCardNumber(e.target.value) })
              }
            />
            <input
              placeholder="Name on Card"
              value={cardForm.nameOnCard}
              onChange={(e) =>
                setCardForm({ ...cardForm, nameOnCard: e.target.value })
              }
            />
            <input
              placeholder="Expiry (MM/YY)"
              value={cardForm.expiry}
              maxLength="5"
              onChange={(e) =>
                setCardForm({ ...cardForm, expiry: formatExpiry(e.target.value) })
              }
            />
            <input
              placeholder="CVV"
              value={cardForm.cvv}
              maxLength="3"
              onChange={(e) =>
                setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, "") })
              }
            />
            <input
              placeholder="Billing Address"
              value={cardForm.address}
              onChange={(e) =>
                setCardForm({ ...cardForm, address: e.target.value })
              }
            />
            <button onClick={addCard}>Save Card</button>
          </div>
        )}

        <div className="section-title">Other Payment Options</div>
        <div className="payment-option">
          <span>Link PayPal Account</span>
          <IoArrowForward />
        </div>
        <div className="payment-option">
          <span>Link Bank Account</span>
          <IoArrowForward />
        </div>

        {message && <p className="wallet-msg">{message}</p>}
      </div>
    </MobileContainer>
  );
}
