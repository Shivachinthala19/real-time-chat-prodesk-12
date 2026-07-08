import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:4000`;

const socket = io(backendUrl, {
  transports: ['websocket', 'polling'],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

socket.on("connect", () => {
  console.log(`✅ [HANDSHAKE] WebSocket connected → socket.id: ${socket.id}`);
});

socket.on("disconnect", (reason) => {
  console.log(`❌ [DISCONNECT] WebSocket closed. Reason: ${reason}`);
});

socket.on("connect_error", (err) => {
  console.error(`🔴 [ERROR] Connection failed: ${err.message}`);
});

export default socket;
