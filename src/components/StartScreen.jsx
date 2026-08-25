import { useEffect, useState } from 'react';
import DifficultySelect from './DifficultySelect';
import { getHighScores, getBestWave, gameStorage } from '../engine/systems/gameStorage.js';
import GameButton from './ui/GameButton';
import GlassSurface from './ui/GlassSurface';
import IconButton from './ui/IconButton';
import GameIcon, { GameMark } from './ui/GameIcon';
import OverlaySheet from './ui/OverlaySheet';
import StatRow from './ui/StatRow';
import './StartScreen.css';

const difficulties = ['easy', 'normal', 'hard', 'nightmare'];

export default function StartScreen({ onStartGame, onStartTutorial }) {
  const [view, setView] = useState('main');
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [highScores, setHighScores] = useState({});
  const [profile, setProfile] = useState({ bestWave: 0, totalKills: 0, difficulty: 'normal' });

  useEffect(() => {
    const scores = Object.fromEntries(difficulties.map((difficulty) => [difficulty, getHighScores(difficulty).slice(0, 3)]));
    const settings = gameStorage.getSettings();
    const lifetime = gameStorage.getLifetimeStats();
    setHighScores(scores);
    setProfile({ bestWave: Math.max(...difficulties.map(getBestWave)), totalKills: lifetime.totalKills, difficulty: settings.difficulty || 'normal' });
  }, []);

  if (view === 'difficulty') {
    return <DifficultySelect onSelectDifficulty={(difficulty) => { setView('main'); onStartGame(difficulty); }} onBack={() => setView('main')} />;
  }

  const formatNumber = (value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value;
  const hasScores = Object.values(highScores).some((scores) => scores.length > 0);

  return (
    <main id="start-screen" className="lobby-shell">
      <header className="lobby-topbar"><div className="lobby-brand"><GameMark size={34} /><div><span className="lobby-brand__eyebrow">STACK SHOOTER</span><h1>Vampire Siege</h1></div></div><IconButton icon="settings" label="Settings" /></header>
      <div className="lobby-content">
        <GlassSurface className="profile-widget"><div className="profile-widget__heading"><div><p className="section-label">PLAYER PROFILE</p><h2>Slayer_01</h2><span>LEVEL 01 · PRE-ALPHA</span></div><GameIcon name="shield" size={30} /></div><div className="profile-widget__progress"><div><span>FIELD EXPERIENCE</span><strong>{profile.bestWave ? `WAVE ${profile.bestWave}` : 'READY FOR DEPLOYMENT'}</strong></div><div className="progress-track"><i style={{ width: `${Math.min(100, profile.bestWave * 8)}%` }} /></div></div></GlassSurface>
        <GameButton variant="primary" className="quick-start" onClick={() => setView('difficulty')}><GameIcon name="play" size={24} /><span><strong>QUICK START</strong><small>Choose your difficulty</small></span></GameButton>
        <section className="lobby-section"><div className="lobby-section__heading"><p className="section-label">MISSION CONTROL</p><span>SELECT ACTIVITY</span></div><div className="lobby-actions"><button className="lobby-action lobby-action--primary" onClick={() => setView('difficulty')}><GameIcon name="shield" size={27} /><span><strong>SOLO PLAY</strong><small>Endless waves · survive</small></span><GameIcon name="back" size={18} className="lobby-action__arrow" /></button><button className="lobby-action lobby-action--secondary" onClick={onStartTutorial}><GameIcon name="tutorial" size={27} /><span><strong>TUTORIAL</strong><small>Learn the field mechanics</small></span><GameIcon name="back" size={18} className="lobby-action__arrow" /></button><button className="lobby-action" onClick={() => setShowHowToPlay(true)}><GameIcon name="info" size={27} /><span><strong>FIELD GUIDE</strong><small>Controls and upgrades</small></span><GameIcon name="back" size={18} className="lobby-action__arrow" /></button></div></section>
        <section className="lobby-stats"><StatRow label="Best wave" value={profile.bestWave} accent="primary" /><StatRow label="Total kills" value={formatNumber(profile.totalKills)} accent="secondary" /><StatRow label="Last mode" value={profile.difficulty} accent="gold" /></section>
        {hasScores && <GlassSurface className="rankings-preview"><div className="lobby-section__heading"><p className="section-label">RANKINGS</p><span>LOCAL RECORDS</span></div>{difficulties.map((difficulty) => { const score = highScores[difficulty]?.[0]; return score && <div className="ranking-line" key={difficulty}><span>{difficulty}</span><strong>{score.score.toLocaleString()}</strong><small>WAVE {score.wave}</small></div>; })}</GlassSurface>}
      </div>
      <nav className="lobby-bottom-nav" aria-label="Main navigation"><button className="is-active"><GameIcon name="play" size={21} /><span>PLAY</span></button><button><GameIcon name="shield" size={21} /><span>ARMORY</span></button><button><GameIcon name="trophy" size={21} /><span>RANKINGS</span></button><button><GameIcon name="users" size={21} /><span>SOCIAL</span></button></nav>
      {showHowToPlay && <OverlaySheet title="Field Guide" kicker="VAMPIRE SIEGE" onClose={() => setShowHowToPlay(false)} className="field-guide"><div className="guide-block"><GameIcon name="shield" size={24} /><div><h3>Objective</h3><p>Survive each vampire wave, collect upgrades, and hold the field as long as possible.</p></div></div><div className="guide-block"><GameIcon name="zap" size={24} /><div><h3>Controls</h3><p>Move with the left control, aim and fire with the right control, and use Dash to escape pressure.</p></div></div><div className="guide-block"><GameIcon name="trophy" size={24} /><div><h3>Upgrades</h3><p>Every few waves, choose one upgrade to shape your run.</p></div></div></OverlaySheet>}
    </main>
  );
}
