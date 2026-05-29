// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration"; // added for PWA

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker
serviceWorkerRegistration.register();

//Prevent pinch-to-zoom and double-tap zoom on iOS
document.addEventListener("gesturestart", function (e) {
  e.preventDefault();
});
