const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");


const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",   // Vite dev server or Prod URL
    methods: ["GET", "POST"],
  },
});

const connectedUsers = new Map();

// Rooms available in the application
const ROOMS = ["General", "Tech Support", "Random"];

const typingUsers = new Map();
ROOMS.forEach((room) => typingUsers.set(room, new Set()));


function broadcastRoomUsers(room) {
  const usersInRoom = [];
  connectedUsers.forEach((userData) => {
    if (userData.room === room) usersInRoom.push(userData.username);
  });
  io.to(room).emit("room:users", { room, users: usersInRoom });
}

io.on("connection", (socket) => {
  console.log(`✅ [HANDSHAKE] Client connected → socket.id: ${socket.id}`);

  socket.on("user:join", ({ username, room }) => {
    // Persist user state on the server
    connectedUsers.set(socket.id, { username, room });

    socket.join(room);

    console.log(`👤 [JOIN] ${username} joined room "${room}"`);

    // Notify the room that a new user joined
    io.to(room).emit("room:notification", {
      type: "join",
      message: `${username} joined the room`,
      timestamp: new Date().toISOString(),
    });

    // Broadcast updated user list for the room
    broadcastRoomUsers(room);
  });

  // ──────────────────────────────────────────
  //  Phase 3: User switches rooms
  // ──────────────────────────────────────────
  socket.on("room:switch", ({ newRoom }) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    const { username, room: oldRoom } = user;

    // Remove from typing state in old room
    typingUsers.get(oldRoom)?.delete(username);
    io.to(oldRoom).emit("typing:update", {
      room: oldRoom,
      typingList: [...(typingUsers.get(oldRoom) || [])],
    });

    // Leave old room, notify members
    socket.leave(oldRoom);
    io.to(oldRoom).emit("room:notification", {
      type: "leave",
      message: `${username} left the room`,
      timestamp: new Date().toISOString(),
    });
    broadcastRoomUsers(oldRoom);

    // Update user's room in state
    connectedUsers.set(socket.id, { username, room: newRoom });

    // Join new room
    socket.join(newRoom);
    console.log(`🔀 [SWITCH] ${username} moved from "${oldRoom}" → "${newRoom}"`);

    // Notify new room
    io.to(newRoom).emit("room:notification", {
      type: "join",
      message: `${username} joined the room`,
      timestamp: new Date().toISOString(),
    });
    broadcastRoomUsers(newRoom);
  });


  socket.on("message:send", ({ text }) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    const { username, room } = user;

    typingUsers.get(room)?.delete(username);
    io.to(room).emit("typing:update", {
      room,
      typingList: [...(typingUsers.get(room) || [])],
    });

    const payload = {
      id: `${socket.id}-${Date.now()}`,
      username,
      text,
      room,
      timestamp: new Date().toISOString(),
    };

    console.log(`💬 [MESSAGE] [${room}] ${username}: ${text}`);

    io.to(room).emit("message:receive", payload);
  });


  socket.on("typing:start", () => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    const { username, room } = user;
    typingUsers.get(room)?.add(username);

    // Broadcast updated typing list to everyone else in room
    socket.to(room).emit("typing:update", {
      room,
      typingList: [...(typingUsers.get(room) || [])],
    });
  });

  socket.on("typing:stop", () => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    const { username, room } = user;
    typingUsers.get(room)?.delete(username);

    socket.to(room).emit("typing:update", {
      room,
      typingList: [...(typingUsers.get(room) || [])],
    });
  });


  socket.on("disconnect", () => {
    const user = connectedUsers.get(socket.id);

    if (user) {
      const { username, room } = user;
      console.log(`❌ [DISCONNECT] ${username} disconnected from room "${room}"`);

      // Clean up typing indicators
      typingUsers.get(room)?.delete(username);
      io.to(room).emit("typing:update", {
        room,
        typingList: [...(typingUsers.get(room) || [])],
      });

      // Notify room of departure
      io.to(room).emit("room:notification", {
        type: "leave",
        message: `${username} left the room`,
        timestamp: new Date().toISOString(),
      });

      connectedUsers.delete(socket.id);
      broadcastRoomUsers(room);
    } else {
      console.log(`❌ [DISCONNECT] Unknown socket: ${socket.id}`);
    }
  });
});


app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    connectedClients: connectedUsers.size,
    rooms: ROOMS,
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────
//  Start Server
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`\n🚀 Socket.io server running → http://localhost:${PORT}`);
  console.log(`📡 WebSocket endpoint ready for bidirectional streams\n`);
});
