// src/Main.js
import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import AdminDashboard from "./pages/AdminDashboard";
import ARViewer from "./pages/ARViewer";
import Buy from "./pages/Buy";
import CarDetails from "./pages/CarDetails";
import Checkout from "./pages/Checkout";
import Dashboard from "./pages/Dashboard";
import EditProfile from "./pages/EditProfile";
import Favorites from "./pages/Favorites";
import ForgotPassword from "./pages/ForgotPassword";
import Hitch from "./pages/Hitch";
import Home from "./pages/Home";
import Inbox from "./pages/Inbox";
import Login from "./pages/Login";
import ManageMyPurchases from "./pages/ManageMyPurchases";
import Notifications from "./pages/Notifications";
import Onboarding from "./pages/Onboarding";
import OrderHistory from "./pages/OrderHistory";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import Register from "./pages/Register";
import RentCar from "./pages/RentCar";
import ResetPassword from "./pages/ResetPassword";
import SalesHistory from "./pages/SalesHistory";
import Search from "./pages/Search";
import SellCar from "./pages/SellCar";
import Settings from "./pages/Settings";
import SplashScreen from "./pages/SplashScreen";
import Subscription from "./pages/Subscription";
import ThankYou from "./pages/ThankYou";
import VerifyPage from "./pages/VerifyPage";
import VerifyResetCode from "./pages/VerifyResetCode";
import Wallet from "./pages/Wallet";
import Verification from "./pages/Verification";
import VerifyRequestsAdmin from "./pages/admin/VerifyRequestsAdmin";

import "./theme.css";

function Main() {
  const [splashDone, setSplashDone] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const hasSeenOnboarding = localStorage.getItem("onboarded") === "true";

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.body.setAttribute("data-theme", savedTheme);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashDone(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (splashDone) {
      const publicRoutes = [
        "/login", "/register", "/forgot-password", "/verify", "/verify-reset", "/reset-password"
      ];

      if (!token && !hasSeenOnboarding) {
        localStorage.setItem("onboarded", "true");
        navigate("/onboarding");
      } else if (!token && !publicRoutes.includes(location.pathname)) {
        navigate("/login");
      } else if (token && (location.pathname === "/" || location.pathname === "/onboarding")) {
        navigate("/home");
      }
    }
  }, [splashDone, hasSeenOnboarding, location.pathname, navigate]);

  const hideNavOn = [
    "/", "/onboarding", "/login", "/register", "/verify",
    "/verify-reset", "/forgot-password", "/reset-password"
  ];
  const shouldShowNav = !hideNavOn.includes(location.pathname);

  return (
    <>
      {!splashDone ? (
        <SplashScreen />
      ) : (
        <div style={{ paddingBottom: shouldShowNav ? "70px" : "0" }}>
          <Routes>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-reset" element={<VerifyResetCode />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/home" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/notification" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/sell" element={<SellCar />} />
            <Route path="/rent" element={<RentCar />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/verification-requests" element={<VerifyRequestsAdmin />} />
            <Route path="/car/:id" element={<CarDetails />} />
            <Route path="/profile/public/:userId" element={<PublicProfile />} />
            <Route path="/ar-viewer" element={<ARViewer />} />
            <Route path="/hitch" element={<Hitch />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/buy" element={<Buy />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-history" element={<OrderHistory />} />
            <Route path="/sales-history" element={<SalesHistory />} />
            <Route path="/manage-purchases" element={<ManageMyPurchases />} />
            <Route path="/thankyou" element={<ThankYou />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/verification" element={<Verification />} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      )}
    </>
  );
}

export default Main;
