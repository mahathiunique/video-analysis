import React, { useEffect, useRef, useState } from "react";
import Video from "twilio-video";
import Participant from "./Participant";
import ChatBox from "./ChatBox";

// === Backend URL (IMPORTANT FIX) ===
const API_BASE = "http://localhost:5000";

export default function VideoRoom({ username, roomName }) {
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [pinnedSid, setPinnedSid] = useState("local");

  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);

  // === recording download info ===
  const [downloadInfo, setDownloadInfo] = useState(null);

  const mainRef = useRef(null);

  // ----------------------------------------------------------
  // JOIN ROOM + GET TWILIO ACCESS TOKEN
  // ----------------------------------------------------------
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const resp = await fetch(`${API_BASE}/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identity: username, room: roomName }),
        });

        const data = await resp.json();
        if (!data.token) {
          console.error("Token fetch failed:", data);
          return;
        }

        const videoRoom = await Video.connect(data.token, {
          audio: true,
          video: { width: 640 }
        });

        if (!mounted) return;

        setRoom(videoRoom);

        // Handle participants already connected
        setParticipants(Array.from(videoRoom.participants.values()));

        // Participant connected
        videoRoom.on("participantConnected", (participant) => {
          setParticipants((prev) => [...prev, participant]);
        });

        // Participant disconnected
        videoRoom.on("participantDisconnected", (participant) => {
          setParticipants((prev) => prev.filter((p) => p !== participant));
        });

      } catch (err) {
        console.error("Join room error:", err);
      }
    }

    init();
    return () => { mounted = false };
  }, [username, roomName]);

  // ----------------------------------------------------------
  // POLL BACKEND FOR RECORDING DOWNLOAD (AFTER ROOM ENDS)
  // ----------------------------------------------------------
  useEffect(() => {
    if (!room) return;

    const interval = setInterval(async () => {
      try {
        const resp = await fetch(`${API_BASE}/recordings/${room.sid}`);
        const data = await resp.json();

        if (data.ready) {
          setDownloadInfo(data);   // { ready: true, url: "/recordings-files/xxx.mp4" }
          clearInterval(interval);
        }
      } catch (err) {
        console.log("Recording polling error:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [room]);

  // ----------------------------------------------------------
  // LEAVE ROOM
  // ----------------------------------------------------------
  const leaveRoom = () => {
    if (room) {
      room.disconnect();
      setRoom(null);
    }
  };

  // ----------------------------------------------------------
  // RENDER UI
  // ----------------------------------------------------------
  return (
    <div className="video-room">

      <h2>Room: {roomName}</h2>
      <h3>User: {username}</h3>

      <button onClick={leaveRoom} style={{ marginBottom: "15px" }}>
        Leave Room
      </button>

      {/* ------------------- VIDEO AREA ------------------- */}
      <div className="main-video" ref={mainRef}>
        {pinnedSid === "local" && room ? (
          <Participant participant={room.localParticipant} isLocal={true} />
        ) : null}

        {pinnedSid !== "local" &&
          participants
            .filter((p) => p.sid === pinnedSid)
            .map((p) => (
              <Participant key={p.sid} participant={p} />
            ))}
      </div>

      {/* ------------------- THUMBNAILS ------------------- */}
      <div className="thumbnails">
        {room && (
          <div onClick={() => setPinnedSid("local")}>
            <Participant participant={room.localParticipant} isLocal={true} small />
          </div>
        )}

        {participants.map((p) => (
          <div key={p.sid} onClick={() => setPinnedSid(p.sid)}>
            <Participant participant={p} small />
          </div>
        ))}
      </div>

      {/* ------------------- CHAT ------------------- */}
      <ChatBox room={room} username={username} />

      {/* ------------------- RECORDING DOWNLOAD BUTTON ------------------- */}
      {downloadInfo?.ready && (
        <a
          href={`${API_BASE}${downloadInfo.url}`}
          download
          style={{
            marginTop: "20px",
            display: "inline-block",
            padding: "12px 20px",
            background: "green",
            color: "white",
            borderRadius: "10px",
            textDecoration: "none",
            fontSize: "16px"
          }}
        >
          Download Recording
        </a>
      )}
    </div>
  );
}
