// Phase 3: Room configuration
const ROOMS = [
  { id: "General",      icon: "💬", desc: "Open discussion for everyone" },
  { id: "Tech Support", icon: "🔧", desc: "Need help? Ask here" },
  { id: "Random",       icon: "🎲", desc: "Off-topic & fun" },
];

/**
 * RoomSelector — Phase 3 sidebar panel
 * Renders the list of rooms and handles room switching via onSwitch callback.
 * Also displays the current room's online users list.
 */
export default function RoomSelector({ currentRoom, onSwitch, onlineUsers }) {
  return (
    <>
      {/* Channels Section */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Channels</div>
        {ROOMS.map((room) => (
          <button
            key={room.id}
            id={`room-btn-${room.id.replace(" ", "-").toLowerCase()}`}
            className={`room-btn ${currentRoom === room.id ? "active" : ""}`}
            onClick={() => currentRoom !== room.id && onSwitch(room.id)}
            title={room.desc}
          >
            <span className="room-btn-icon">{room.icon}</span>
            <span className="room-btn-name">{room.id}</span>
            {currentRoom === room.id && onlineUsers.length > 0 && (
              <span className="room-btn-count">{onlineUsers.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="sidebar-divider" />

      {/* Online Users Section */}
      <div className="sidebar-section-title" style={{ padding: "0 20px", marginTop: "4px" }}>
        In Room · {onlineUsers.length}
      </div>
      <div className="online-users-section">
        {onlineUsers.length === 0 ? (
          <div style={{ color: "var(--clr-text-muted)", fontSize: "0.8rem", padding: "8px 8px" }}>
            No users online
          </div>
        ) : (
          onlineUsers.map((name) => (
            <div key={name} className="user-list-item">
              <div className="user-avatar">
                {name.slice(0, 2).toUpperCase()}
              </div>
              <span className="user-name-text">{name}</span>
            </div>
          ))
        )}
      </div>
    </>
  );
}
