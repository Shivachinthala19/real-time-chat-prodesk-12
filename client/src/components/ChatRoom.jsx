import { useState, useEffect, useCallback } from "react";
import socket from "../socket";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import RoomSelector from "./RoomSelector";

const ROOM_META = {
  "General":      { icon: "💬", desc: "Open discussion for everyone" },
  "Tech Support": { icon: "🔧", desc: "Technical help & debugging" },
  "Random":       { icon: "🎲", desc: "Off-topic & fun conversations" },
};

/**
 * ChatRoom — the main chat UI, integrating all three phases.
 *
 * Phase 1: Bidirectional message broadcast
 * Phase 2: Session identity + typing indicators
 * Phase 3: Room switching with strict payload isolation
 */
export default function ChatRoom({ username, initialRoom }) {
  const [messages, setMessages]       = useState([]);
  const [typingList, setTypingList]   = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(initialRoom);
  const [connStatus, setConnStatus]   = useState("connecting");

  // ─── Socket Lifecycle ───────────────────────────────────────
  useEffect(() => {
    // Phase 1: Connect and emit join event
    socket.connect();

    function onConnect() {
      setConnStatus("connected");
      // Phase 2 & 3: Announce identity and room to server
      socket.emit("user:join", { username, room: currentRoom });
    }

    function onDisconnect() { setConnStatus("disconnected"); }
    function onConnectError() { setConnStatus("disconnected"); }

    socket.on("connect",       onConnect);
    socket.on("disconnect",    onDisconnect);
    socket.on("connect_error", onConnectError);

    if (socket.connected) {
      setConnStatus("connected");
      socket.emit("user:join", { username, room: currentRoom });
    }

    return () => {
      socket.off("connect",       onConnect);
      socket.off("disconnect",    onDisconnect);
      socket.off("connect_error", onConnectError);
    };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Message & Event Listeners ──────────────────────────────
  useEffect(() => {
    // Phase 1: Receive broadcasted messages
    function onMessageReceive(msg) {
      setMessages((prev) => [...prev, msg]);
    }

    // Phase 2: Typing indicator update from server
    function onTypingUpdate({ typingList: list }) {
      // Filter out self from the typing indicator display
      setTypingList(list.filter((u) => u !== username));
    }

    // Phase 3: Room notification (join/leave events)
    function onRoomNotification(data) {
      setMessages((prev) => [
        ...prev,
        {
          id: `notif-${Date.now()}-${Math.random()}`,
          type: "notification",
          message: data.message,
          timestamp: data.timestamp,
        },
      ]);
    }

    // Phase 3: Online users list update
    function onRoomUsers({ users }) {
      setOnlineUsers(users);
    }

    socket.on("message:receive",    onMessageReceive);
    socket.on("typing:update",      onTypingUpdate);
    socket.on("room:notification",  onRoomNotification);
    socket.on("room:users",         onRoomUsers);

    return () => {
      socket.off("message:receive",   onMessageReceive);
      socket.off("typing:update",     onTypingUpdate);
      socket.off("room:notification", onRoomNotification);
      socket.off("room:users",        onRoomUsers);
    };
  }, [username]);

  // ─── Event Emitters ─────────────────────────────────────────

  // Phase 1: Send a message to the server
  const handleSend = useCallback((text) => {
    socket.emit("message:send", { text });
  }, []);

  // Phase 2: Typing event emitters
  const handleTypingStart = useCallback(() => {
    socket.emit("typing:start");
  }, []);

  const handleTypingStop = useCallback(() => {
    socket.emit("typing:stop");
  }, []);

  // Phase 3: Room switch
  const handleRoomSwitch = useCallback((newRoom) => {
    // Clear local message + typing state for the new room
    setMessages([]);
    setTypingList([]);
    setCurrentRoom(newRoom);
    socket.emit("room:switch", { newRoom });
  }, []);

  // ─── Typing indicator text ──────────────────────────────────
  function getTypingText() {
    if (typingList.length === 0) return null;
    if (typingList.length === 1) return `${typingList[0]} is typing…`;
    if (typingList.length === 2) return `${typingList[0]} and ${typingList[1]} are typing…`;
    return `${typingList[0]} and ${typingList.length - 1} others are typing…`;
  }

  const roomMeta = ROOM_META[currentRoom] || { icon: "💬", desc: "" };
  const typingText = getTypingText();

  return (
    <div className="chat-layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        {/* Sidebar header */}
        <div className="sidebar-header">
          <div className="sidebar-logo-icon">⚡</div>
          <span className="sidebar-logo-text text-gradient">NexusChat</span>
        </div>

        {/* Phase 3: Room list + online users */}
        <RoomSelector
          currentRoom={currentRoom}
          onSwitch={handleRoomSwitch}
          onlineUsers={onlineUsers}
        />

        {/* Sidebar footer — current user identity */}
        <div className="sidebar-footer">
          <div className="sidebar-footer-avatar">
            {username.slice(0, 2).toUpperCase()}
          </div>
          <div className="sidebar-footer-info">
            <div className="sidebar-footer-name">{username}</div>
            <div className="sidebar-footer-status">● Online</div>
          </div>
          <span className="badge badge-cyan">WS</span>
        </div>
      </aside>

      {/* ── Main chat area ── */}
      <main className="chat-main">
        {/* Connection status bar */}
        <div className={`connection-status ${connStatus}`}>
          {connStatus === "connected" && (
            <>
              <span className="status-dot" />
              WebSocket connected · {username} · #{currentRoom}
            </>
          )}
          {connStatus === "connecting" && "⏳ Connecting to server…"}
          {connStatus === "disconnected" && "🔴 Disconnected — attempting to reconnect…"}
        </div>

        {/* Chat header */}
        <header className="chat-header">
          <div className="chat-header-left">
            <div className="chat-header-room-icon">{roomMeta.icon}</div>
            <div>
              <div className="chat-header-room-name">#{currentRoom}</div>
              <div className="chat-header-room-desc">{roomMeta.desc}</div>
            </div>
          </div>
          <div className="chat-header-right">
            <span className="badge badge-green">
              <span className="status-dot" style={{ width: 6, height: 6 }} />
              {onlineUsers.length} online
            </span>
            <span className="badge badge-purple">Socket.io</span>
          </div>
        </header>

        {/* Phase 1 & 2 & 3: Message feed */}
        <MessageList messages={messages} currentUser={username} />

        {/* Phase 2: Typing indicator */}
        <div className="typing-indicator">
          {typingText && (
            <>
              <div className="typing-dots">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
              <span className="typing-text">{typingText}</span>
            </>
          )}
        </div>

        {/* Phase 1 & 2: Message input */}
        <MessageInput
          onSend={handleSend}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
          disabled={connStatus !== "connected"}
        />
      </main>
    </div>
  );
}
