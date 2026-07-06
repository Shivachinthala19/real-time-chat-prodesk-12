import { useState } from "react";

// Phase 3: Available rooms
const ROOMS = [
  { id: "General", icon: "💬", desc: "Open discussion" },
  { id: "Tech Support", icon: "🔧", desc: "Technical help" },
  { id: "Random", icon: "🎲", desc: "Off-topic fun" },
];

/**
 * Phase 2: JoinScreen — prompts the user for a username and room selection
 * before establishing the WebSocket connection.
 */
export default function JoinScreen({ onJoin }) {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("General");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      setError("Please enter a display name.");
      return;
    }
    if (trimmed.length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    onJoin({ username: trimmed, room });
  }

  return (
    <div className="join-screen">
      <div className="glass-card join-card">
        {/* Logo */}
        <div className="join-logo">
          <div className="join-logo-icon">⚡</div>
          <h1 className="join-logo-text text-gradient">NexusChat</h1>
        </div>

        <p className="join-subtitle">
          Real-time WebSocket communication platform.<br />
          Enter your identity to join the stream.
        </p>

        <form className="join-form" onSubmit={handleSubmit} autoComplete="off">
          {/* Username */}
          <div className="join-form-group">
            <label htmlFor="username-input">Display Name</label>
            <input
              id="username-input"
              type="text"
              className="input-field"
              placeholder="e.g.Shiva…"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(""); }}
              maxLength={24}
              autoFocus
            />
            {error && (
              <span style={{ color: "var(--clr-danger)", fontSize: "0.8rem", marginTop: "6px" }}>
                {error}
              </span>
            )}
          </div>

          {/* Phase 3: Room selection */}
          <div className="join-form-group">
            <label>Select Channel</label>
            <div className="room-grid">
              {ROOMS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`room-option ${room === r.id ? "active" : ""}`}
                  onClick={() => setRoom(r.id)}
                  id={`room-option-${r.id.replace(" ", "-").toLowerCase()}`}
                >
                  <span className="room-option-icon">{r.icon}</span>
                  <span>{r.id}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            id="join-btn"
            type="submit"
            className="btn btn-primary join-btn w-full"
          >
            ⚡ Connect to {room}
          </button>
        </form>

        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <div className="flex flex-center flex-gap-sm" style={{ justifyContent: "center" }}>
            <span className="badge badge-green">
              <span className="status-dot" style={{ width: 6, height: 6 }}></span>
              Socket.io Active
            </span>
            <span className="badge badge-purple">Phase 1-2-3</span>
          </div>
        </div>
      </div>
    </div>
  );
}
