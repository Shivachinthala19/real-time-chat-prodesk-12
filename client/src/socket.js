import { io } from "socket.io-client";

// Phase 1: Establish persistent connection to the Socket.io server
// autoConnect: false → we manually connect after the user enters their username
const socket = io("http://localhost:4000", {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Phase 1: Log successful client handshake to the console
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
