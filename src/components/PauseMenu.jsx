import { useState } from 'react';
import './PauseMenu.css';
import { gameStorage } from '../engine/systems/gameStorage.js';
import { soundManager } from '../engine/systems/sound.js';
import GameButton from './ui/GameButton';
import GamePanel from './ui/GamePanel';

export default function PauseMenu({ onResume, onRestart, onMainMenu, stats }) {
  const [view, setView] = useState('menu');
  const [settings, setSettings] = useState(() => gameStorage.getSettings());
  const lifetime = gameStorage.getLifetimeStats();
  const confirmLoss = (action) => { if (window.confirm('Your current run will be lost. Continue?')) action(); };
  const updateSetting = (updates) => {
    const next = { ...settings, ...updates }; setSettings(next); gameStorage.setSettings(updates);
    if (updates.soundEnabled !== undefined) updates.soundEnabled ? soundManager.unmute() : soundManager.mute();
    if (updates.soundVolume !== undefined) soundManager.setVolume(updates.soundVolume);
    if (updates.musicVolume !== undefined) soundManager.setMusicVolume(updates.musicVolume);
  };
  const menu = <><p className="pause-kicker">RUN IN PROGRESS</p><h2>PAUSED</h2><nav className="pause-buttons" aria-label="Pause menu">
    <GameButton variant="primary" className="pause-btn" onClick={onResume}>Resume Game</GameButton>
    <GameButton className="pause-btn" onClick={() => confirmLoss(onRestart)}>Restart Run</GameButton>
    <GameButton className="pause-btn" onClick={() => setView('settings')}>Settings</GameButton>
    <GameButton className="pause-btn" onClick={() => setView('stats')}>Run Stats</GameButton>
    <GameButton variant="danger" className="pause-btn" onClick={() => confirmLoss(onMainMenu)}>Exit to Main Menu</GameButton>
  </nav></>;
  const settingsView = <><p className="pause-kicker">SYSTEM SETTINGS</p><h2>SETTINGS</h2><div className="pause-settings">
    <label className="pause-toggle"><span>Sound effects</span><input type="checkbox" checked={settings.soundEnabled !== false} onChange={(e) => updateSetting({ soundEnabled: e.target.checked })} /></label>
    <label>Effects volume <output>{Math.round(settings.soundVolume * 100)}%</output><input type="range" min="0" max="1" step="0.05" value={settings.soundVolume} onChange={(e) => updateSetting({ soundVolume: Number(e.target.value) })} /></label>
    <label>Music volume <output>{Math.round(settings.musicVolume * 100)}%</output><input type="range" min="0" max="1" step="0.05" value={settings.musicVolume} onChange={(e) => updateSetting({ musicVolume: Number(e.target.value) })} /></label>
  </div><GameButton className="pause-btn" onClick={() => setView('menu')}>Back</GameButton></>;
  const statsView = <><p className="pause-kicker">CURRENT RUN</p><h2>RUN STATS</h2><div className="run-stats">
    <span>Wave <strong>{stats.wave}</strong></span><span>Kills <strong>{stats.kills}</strong></span><span>Score <strong>{stats.score.toLocaleString()}</strong></span>
    <span>Best score <strong>{gameStorage.getBestScore(stats.difficulty)}</strong></span><span>Total kills <strong>{lifetime.totalKills.toLocaleString()}</strong></span>
  </div><GameButton className="pause-btn" onClick={() => setView('menu')}>Back</GameButton></>;
  return <div id="pause-menu" role="dialog" aria-modal="true" aria-labelledby="pause-title"><GamePanel className="pause-content"><div id="pause-title">{view === 'menu' ? menu : view === 'settings' ? settingsView : statsView}</div></GamePanel></div>;
}
