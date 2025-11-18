import React, { useState } from "react";
import VideoRoom from "./VideoRoom";

export default function App() {
  const [joined, setJoined] = useState(false);
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");

  return (
    <div className="app-root">
      {!joined ? (
        <div className="join-card">
          <h2>Join Pro Video</h2>
          <input placeholder="Your name" value={username} onChange={e => setUsername(e.target.value)} />
          <input placeholder="Room name" value={room} onChange={e => setRoom(e.target.value)} />
          <button onClick={() => { if (!username || !room) return alert("Enter name & room"); setJoined(true); }}>
            Join
          </button>
        </div>
      ) : (
        <VideoRoom username={username} roomName={room} />
      )}
    </div>
  );
}
