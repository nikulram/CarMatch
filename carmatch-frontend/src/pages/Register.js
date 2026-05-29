// src/pages/Register.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./Register.module.css";
import MobileContainer from "../components/MobileContainer";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import VahanaLogo from "../assets/Vahana_Logo.png";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const validatePassword = (password) => {
    return /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!validatePassword(formData.password)) {
      setError("Password must include 8+ chars, uppercase, number, and special character.");
      return;
    }

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/auth/register`, formData);
      if (res.status === 201) {
        localStorage.setItem("emailForVerification", formData.email);
        navigate("/verify");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <MobileContainer>
      <div className={styles.registerContainer}>
        <div className={styles.topGradient} />
        <div className={styles.innerBox}>
          <div className={styles.logoWrapper}>
            <img src={VahanaLogo} alt="Vahana Logo" className={styles.logo} />
          </div>
          <h2 className={styles.title}>Create Account</h2>
          <form onSubmit={handleRegister} className={styles.form}>
            <input
              type="text"
              placeholder="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
              className={styles.input}
            />
            <input
              type="text"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
              className={styles.input}
            />
            <input
              type="text"
              placeholder="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              className={styles.input}
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className={styles.input}
            />
            <div className={styles.passwordContainer}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className={styles.input}
              />
              <div className={styles.eyeIcon} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              </div>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.button}>
              Register
            </button>
            <p className={styles.switchText}>
              Already have an account?{" "}
              <span className={styles.link} onClick={() => navigate("/login")}>
                Login
              </span>
            </p>
          </form>
        </div>
        <div className={styles.bottomGradient} />
      </div>
    </MobileContainer>
  );
}
