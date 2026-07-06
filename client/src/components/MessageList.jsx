import { useEffect, useRef } from "react";

export default function MessageList({ messages, currentUser }) {
  const bottomRef = useRef(null);

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="message-feed">
        <div className="empty-state">
          <div className="empty-state-icon">💬</div>
          <p className="empty-state-text">No messages yet — say hello!</p>
        </div>
        <div ref={bottomRef} />
      </div>
    );
  }

  return (
    <div className="message-feed">
      {messages.map((msg) => {
        // Notification events (join / leave)
        if (msg.type === "notification") {
          return (
            <div key={msg.id} className="notification-bar">
              <span className="notification-dot" />
              <span className="notification-text">{msg.message}</span>
              <span className="notification-dot" />
            </div>
          );
        }

        // Regular chat message
        const isOwn = msg.username === currentUser;
        const initials = msg.username.slice(0, 2).toUpperCase();
        const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <div
            key={msg.id}
            className={`message-wrapper ${isOwn ? "own" : ""}`}
          >
            {/* Avatar — hidden for own messages via CSS flex-reverse */}
            <div className="message-avatar">{initials}</div>

            <div className="message-bubble-group">
              {/* Sender + Timestamp */}
              <div className="message-meta">
                <span className="message-sender">
                  {isOwn ? "You" : msg.username}
                </span>
                <span className="message-time">{timeStr}</span>
              </div>

              {/* Bubble — Phase 2: formatted as [Username]: text */}
              <div className={`message-bubble ${isOwn ? "own" : "others"}`}>
                {!isOwn && (
                  <span className="msg-tag">{msg.username}</span>
                )}
                {msg.text}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
