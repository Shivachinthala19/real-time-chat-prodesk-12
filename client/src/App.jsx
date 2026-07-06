import { useState } from "react";
import JoinScreen from "./components/JoinScreen";
import ChatRoom from "./components/ChatRoom";

export default function App() {
  const [screen, setScreen] = useState("join");
  const [session, setSession] = useState({ username: "", room: "General" });

  function handleJoin({ username, room }) {
    setSession({ username, room });
    setScreen("chat");
  }

  if (screen === "join") {
    return <JoinScreen onJoin={handleJoin} />;
  }

  return <ChatRoom username={session.username} initialRoom={session.room} />;
}
