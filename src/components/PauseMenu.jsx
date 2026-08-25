import { useState } from 'react';
import './PauseMenu.css';
import { gameStorage } from '../engine/systems/gameStorage.js';
import { soundManager } from '../engine/systems/sound.js';
import GameButton from './ui/GameButton';
import GameIcon from './ui/GameIcon';
import OverlaySheet from './ui/OverlaySheet';
import StatRow from './ui/StatRow';

export default function PauseMenu({ onResume, onRestart, onMainMenu, stats }) {
  const [view, setView] = useState('menu');
  const [settings, setSettings] = useState(() => gameStorage.getSettings());
  const lifetime = gameStorage.getLifetimeStats();
  const confirmLoss = (action) => { if (window.confirm('Your current run will be lost. Continue?')) action(); };
  const updateSetting = (updates) => { const next = { ...settings, ...updates }; setSettings(next); gameStorage.setSettings(updates); if (updates.soundEnabled !== undefined) updates.soundEnabled ? soundManager.unmute() : soundManager.mute(); if (updates.soundVolume !== undefined) soundManager.setVolume(updates.soundVolume); if (updates.musicVolume !== undefined) soundManager.setMusicVolume(updates.musicVolume); };
  const menu = <div className="pause-view"><p className="section-label">RUN IN PROGRESS</p><div className="pause-status"><GameIcon name="pause" size={28} /><h2>Paused</h2></div><nav className="pause-actions"><GameButton variant="primary" onClick={onResume}>Resume run</GameButton><GameButton onClick={() => confirmLoss(onRestart)}>Restart run</GameButton><GameButton onClick={() => setView('settings')}>Settings</GameButton><GameButton onClick={() => setView('stats')}>Run stats</GameButton><GameButton variant="danger" onClick={() => confirmLoss(onMainMenu)}>Exit to lobby</GameButton></nav></div>;
  const settingsView = <div className="pause-view"><p className="section-label">SYSTEM SETTINGS</p><h2>Settings</h2><div className="pause-settings"><label><span>Sound effects <output>{settings.soundEnabled !== false ? 'ON' : 'OFF'}</output></span><input type="checkbox" checked={settings.soundEnabled !== false} onChange={(e) => updateSetting({ soundEnabled: e.target.checked })} /></label><label><span>Effects volume <output>{Math.round(settings.soundVolume * 100)}%</output></span><input type="range" min="0" max="1" step="0.05" value={settings.soundVolume} onChange={(e) => updateSetting({ soundVolume: Number(e.target.value) })} /></label><label><span>Music volume <output>{Math.round(settings.musicVolume * 100)}%</output></span><input type="range" min="0" max="1" step="0.05" value={settings.musicVolume} onChange={(e) => updateSetting({ musicVolume: Number(e.target.value) })} /></label></div><GameButton onClick={() => setView('menu')}>Back to pause</GameButton></div>;
  const statsView = <div className="pause-view"><p className="section-label">CURRENT RUN</p><h2>Run stats</h2><div className="pause-stats"><StatRow label="Wave" value={stats.wave} accent="primary" /><StatRow label="Kills" value={stats.kills} accent="secondary" /><StatRow label="Score" value={stats.score.toLocaleString()} accent="gold" /><StatRow label="Best score" value={gameStorage.getBestScore(stats.difficulty)} /><StatRow label="Total kills" value={lifetime.totalKills.toLocaleString()} /></div><GameButton onClick={() => setView('menu')}>Back to pause</GameButton></div>;
  return <OverlaySheet title={view === 'menu' ? 'Paused' : view === 'settings' ? 'Settings' : 'Run stats'} kicker="VAMPIRE SIEGE" className="pause-sheet">{view === 'menu' ? menu : view === 'settings' ? settingsView : statsView}</OverlaySheet>;
}
