import React, { useEffect, useRef } from "react";

export default function Participant({ participant, local = false, room, username, isPinned }) {
  const ref = useRef();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // helper to attach a track to container
    const attach = (track) => {
      const node = track.attach();
      node.style.width = "100%";
      node.style.height = "100%";
      node.style.objectFit = "cover";
      el.appendChild(node);
    };

    const detachAll = () => {
      el.querySelectorAll("video,audio").forEach(n => n.remove());
    };

    // If local: attach local participant tracks
    if (local && room) {
      // find local video track
      room.localParticipant.tracks.forEach(pub => {
        if (pub.track && pub.track.kind === "video") {
          attach(pub.track);
        }
      });
    }

    // If remote participant provided
    if (participant) {
      participant.tracks.forEach(publication => {
        if (publication.isSubscribed) attach(publication.track);
      });
      participant.on("trackSubscribed", attach);
      participant.on("trackUnsubscribed", (track) => {
        track.detach().forEach(n => n.remove());
      });
    }

    return () => {
      // cleanup event listeners
      if (participant) {
        participant.removeAllListeners();
      }
      detachAll();
    };
    // eslint-disable-next-line
  }, [participant, room, local]);

  // small border if pinned
  return (
    <div style={{ width: isPinned ? "100%" : "100%", height: isPinned ? "100%" : "100%", position: "relative" }}>
      <div ref={ref} style={{ width: "100%", height: "100%", borderRadius: 10, overflow: "hidden" }} />
    </div>
  );
}
