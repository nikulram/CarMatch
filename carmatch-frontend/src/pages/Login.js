// src/pages/Login.js
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileContainer from "../components/MobileContainer";
import styles from "./Login.module.css";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import VahanaLogo from "../assets/Vahana_Logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL;

  const sendCode = async () => {
    setMessage("");
    if (!email || !password) {
      return setMessage("Please enter both email and password.");
    }
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      setShowCodeInput(true);
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.error || "Login failed.");
    }
  };

  const verifyCode = async () => {
    setMessage("");
    if (!code || code.length !== 6) {
      return setMessage("Please enter a valid 6-digit code.");
    }
    try {
      const res = await axios.post(`${API_URL}/auth/verify-code`, { email: email.toLowerCase(), code });
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        navigate("/home");
      } else {
        setMessage("Verification failed. Please try again.");
      }
    } catch (err) {
      setMessage(err.response?.data?.error || "Code verification failed.");
    }
  };

  return (
    <MobileContainer>
      <div className={styles.authContainer}>
        <div className={styles.topGradient} />
        <div className={styles.innerBox}>
          <div className={styles.logoWrapper}>
            <img src={VahanaLogo} alt="Vahana Logo" className={styles.logo} />
          </div>

          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to continue to Vahan</p>

          <div className={styles.inputWrapper}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.inputWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
            />
            <div className={styles.eyeIcon} onClick={() => setShowPassword((prev) => !prev)}>
              {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
            </div>
          </div>

          <div className={styles.forgotPassword} onClick={() => navigate("/forgot-password")}>
            Forgot Password?
          </div>

          {!showCodeInput ? (
            <button className={styles.btnPrimary} onClick={sendCode}>
              Send Verification Code
            </button>
          ) : (
            <>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className={styles.input}
              />
              <button className={styles.btnPrimary} onClick={verifyCode}>
                Verify & Login
              </button>
            </>
          )}

          <div className={styles.divider}>
            <div className={styles.line} />
            <span className={styles.orText}>OR</span>
            <div className={styles.line} />
          </div>

          <p className={styles.switchText}>
            Don't have an account?{" "}
            <span className={styles.link} onClick={() => navigate("/register")}>
              Register
            </span>
          </p>

          {message && <p className={styles.message}>{message}</p>}
        </div>
        <div className={styles.bottomGradient} />
      </div>
    </MobileContainer>
  );
}
