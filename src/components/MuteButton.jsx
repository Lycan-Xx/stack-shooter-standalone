import { useState } from 'react';
import './MuteButton.css';

export default function MuteButton({ soundManager }) {
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = () => {
    if (isMuted) {
      soundManager.unmute();
    } else {
      soundManager.mute();
    }
    setIsMuted(!isMuted);
  };

  return (
    <button id="mute-btn" onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
      {isMuted ? '🔇' : '🔊'}
    </button>
  );
}
