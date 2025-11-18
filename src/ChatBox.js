import React, { useEffect, useState } from "react";

export default function ChatBox({ room, username }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [localDataTrack, setLocalDataTrack] = useState(null);

  useEffect(() => {
    if (!room) return;
    // create a LocalDataTrack only once (if not present)
    // Twilio's LocalDataTrack is created in Video.connect options in our code (we didn't include it),
    // so if you want data track published separately, you may create/publish it here.
    // We'll listen for remote data tracks via room participants' tracks.

    const handleTrack = (track, participant) => {



        
      if (track.kind === "data") {
        track.on("message", (msg) => {
          try {
            const obj = JSON.parse(msg);
            if (obj.type === "chat") setMessages(prev => [...prev, { author: obj.from, text: obj.text }]);
            else setMessages(prev => [...prev, { author: participant.identity || "Remote", text: msg }]);
          } catch {
            setMessages(prev => [...prev, { author: participant.identity || "Remote", text: msg }]);
          }
        });
      }
    };

    // subscribe incoming remote data tracks
    room.participants.forEach(p => p.tracks.forEach(pub => {
      if (pub.isSubscribed && pub.track.kind === "data") handleTrack(pub.track, p);
    }));

    room.on("participantConnected", p => {
      p.tracks.forEach(pub => {
        if (pub.isSubscribed && pub.track.kind === "data") handleTrack(pub.track, p);
        pub.on("subscribed", track => { if (track.kind === "data") handleTrack(track, p); });
      });
    });

    return () => {
      // cleanup not strictly necessary
    };
    // eslint-disable-next-line
  }, [room]);

  async function send() {
    if (!text.trim()) return;
    const sender = username || "Me";

    // Send data messages via the LocalDataTrack: simplest is to publish one at connection time.
    // We'll check if the room.localParticipant has any dataTracks published; if none, create one temporarily:
    const pubs = room?.localParticipant?.dataTracks;
    if (pubs && pubs.size > 0) {
      // there may be multiple publications; send via first
      const first = Array.from(pubs.values())[0];
      try {
        first.track.send(JSON.stringify({ type: "chat", from: sender, text }));
      } catch {
        // try fallback
      }
    } else {
      // As fallback: use REST (not implemented). So recommend publishing data track at connect time.
      console.warn("No local data track published. Chat may not be delivered.");
    }

    setMessages(prev => [...prev, { author: "Me", text }]);
    setText("");
  }

  return (
    <div className="chat-box">
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.author === "Me" ? "me" : "other"}`}>
            <strong>{m.author}: </strong>{m.text}
          </div>
        ))}
      </div>
      <div className="chat-inputs">
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Type message..." />
        <button onClick={send}>Send</button>
      </div>
    </div>
  );
}
