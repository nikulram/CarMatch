// src/components/BottomNav.js
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./BottomNav.css";

export default function BottomNav() {
  const [showOptions, setShowOptions] = useState(false);
  const navigate = useNavigate();

  const handleOptionClick = (option) => {
    setShowOptions(false);
    if (option === "buy") {
      navigate("/buy");
    } else if (option === "sell") {
      navigate("/sell");
    } else if (option === "rent") {
      navigate("/rent");
    }
  };

  return (
    <nav className="bottomNav">
      <NavLink to="/home">
        <button>
          <i className="fas fa-home" />
          <span>Home</span>
        </button>
      </NavLink>

      <NavLink to="/search">
        <button>
          <i className="fas fa-search" />
          <span>Search</span>
        </button>
      </NavLink>


      <div className="fabWrapper">
  <div className="fab-options-container">
    <button
      className={`fab-option buy ${showOptions ? "show" : ""}`}
      onClick={() => handleOptionClick("buy")}
    >
      Buy
    </button>
    <button
      className={`fab-option sell ${showOptions ? "show" : ""}`}
      onClick={() => handleOptionClick("sell")}
    >
      Sell
    </button>
    <button
      className={`fab-option rent ${showOptions ? "show" : ""}`}
      onClick={() => handleOptionClick("rent")}
    >
      Rent
    </button>
  </div>

  <button className="fab" onClick={() => setShowOptions(!showOptions)}>
  <span className={`fab-plus ${showOptions ? "open" : ""}`}>+</span>
  </button>
</div>


      <NavLink to="/hitch">
        <button>
          <i className="fas fa-car" />
          <span>Hitch</span>
        </button>
      </NavLink>

      <NavLink to="/profile">
        <button>
          <i className="fas fa-user" />
          <span>Profile</span>
        </button>
      </NavLink>
    </nav>
  );
}
