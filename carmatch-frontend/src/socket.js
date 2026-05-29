// src/socket.js
import { io } from "socket.io-client";

const BACKEND_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export const socket = io(BACKEND_URL, {
  transports: ["websocket"],
  autoConnect: false,
});
