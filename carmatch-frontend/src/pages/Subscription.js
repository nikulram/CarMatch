import axios from "axios";
import React from 'react';
import MobileContainer from '../components/MobileContainer';
import "./Subscription.css";
const API_URL = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem("token");

export default function Subscription() {
    const handleUpgrade = async (plan) => {
        try {
            await axios.put(`${API_URL}/api/orders/subscription`, 
              { subscription: plan.toLowerCase() },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            // maybe redirect or update UI here
          } catch (error) {
            try {
              await axios.put(`http://localhost:5000/api/orders/subscription`,
                { subscription: plan.toLowerCase() },
                { headers: { Authorization: `Bearer ${token}` } }
              );
            } catch (localError) {
              console.error(localError);
            }
          }
};

  return (
    <MobileContainer>
    <div className="subscription-container">
      <h1 className="title">Unlock Full Potential</h1>
      <p className="subtitle">Choose the plan that works best for you</p>

      <div className="plans">

        {/* Free Plan */}
        <div className="plan-card free">
          <div className="badge">Current</div>
          <h2>Free</h2>
          <p className="price">$0<span>/month</span></p>
          <ul className="features">
            <li>Included: Basic Feature XYZ</li>
            <li>Included: Limited XYZ Access</li>
            <li className="disabled">Not included: Premium XYZ Content</li>
            <li className="disabled">Not included: Advanced XYZ Tools</li>
            <li className="disabled">Not included: Exclusive XYZ Features</li>
            <li className="disabled">Not included: Priority XYZ Support</li>
          </ul>
        </div>

        {/* Premium Plan */}
        <div className="plan-card premium">
          <div className="badge popular">POPULAR</div>
          <h2>Premium</h2>
          <p className="price">$9.99<span>/month</span></p>
          <ul className="features">
            <li>Included: All Free Features</li>
            <li>Included: Enhanced XYZ Access</li>
            <li>Included: Premium XYZ Content</li>
            <li>Included: Advanced XYZ Tools</li>
            <li className="disabled">Not included: Exclusive XYZ Features</li>
            <li className="disabled">Not included: Priority XYZ Support</li>
          </ul>
          <button 
            className="upgrade-button premium-btn" 
            onClick={() => handleUpgrade('Premium')}
          >
            Upgrade to Premium
          </button>
        </div>

        {/* Pro Plan */}
        <div className="plan-card pro">
          <h2>Pro</h2>
          <p className="price">$19.99<span>/month</span></p>
          <ul className="features">
            <li>Included: All Premium Features</li>
            <li>Included: Unlimited XYZ Access</li>
            <li>Included: Premium XYZ Content</li>
            <li>Included: Advanced XYZ Tools</li>
            <li>Included: Exclusive XYZ Features</li>
            <li>Included: Priority XYZ Support</li>
          </ul>
          <button 
            className="upgrade-button pro-btn" 
            onClick={() => handleUpgrade('Pro')}
          >
            Upgrade to Pro
          </button>
        </div>

      </div>
    </div>
    </MobileContainer>
  );
}
