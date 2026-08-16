import { useState, useEffect } from 'react';
import { gameStorage } from '../engine/systems/gameStorage.js';
import './MuteButton.css';

export default function MuteButton({ soundManager }) {
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // Initialize from saved settings
    const settings = gameStorage.getSettings();
    setIsMuted(settings.soundEnabled === false);
  }, []);

  const toggleMute = () => {
    const newMuted = !isMuted;
    if (newMuted) {
      soundManager.mute();
    } else {
      soundManager.unmute();
    }
    setIsMuted(newMuted);
    gameStorage.setSettings({ soundEnabled: !newMuted });
  };

  return (
    <button id="mute-btn" onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
      {isMuted ? '🔇' : '🔊'}
    </button>
  );
}
