import { useEffect, useState } from 'react';
import { gameStorage } from '../engine/systems/gameStorage.js';
import GameButton from './ui/GameButton';
import GamePanel from './ui/GamePanel';
import './GameOver.css';

const formatDuration = (durationMs = 0) => {
  const seconds = Math.floor(durationMs / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
};

export default function GameOver({ wave, kills, score, difficulty, durationMs, onRestart, onMainMenu }) {
  const [rank, setRank] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);

  useEffect(() => {
    const best = gameStorage.getBestScore(difficulty);
    setIsNewBest(score > best);
    if (gameStorage.isHighScore(difficulty, score)) {
      setRank(gameStorage.addHighScore(difficulty, { score, wave }));
    }
  }, [difficulty, score, wave]);

  const stats = [['Waves survived', wave], ['Kills', kills], ['Score', score.toLocaleString()], ['Time survived', formatDuration(durationMs)], ['Difficulty', difficulty.toUpperCase()]];
  return <div id="game-over" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
    <GamePanel className="game-over-panel">
      <p className="game-over-kicker">THE HUNT IS OVER</p>
      <h2 id="game-over-title">THE NIGHT HAS CLAIMED YOU</h2>
      <p className="game-over-subtitle">YOUR HUNT ENDS HERE</p>
      {(isNewBest || rank > 0) && <div className="new-best-banner">{rank > 0 ? `NEW RECORD · RANK #${rank}` : 'NEW PERSONAL BEST'}</div>}
      <div id="final-stats">{stats.map(([label, value]) => <div className="stat-card" key={label}><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong></div>)}</div>
      <div className="game-over-buttons"><GameButton variant="primary" className="primary-btn" onClick={onRestart}>Retry</GameButton><GameButton className="secondary-btn" onClick={onMainMenu}>Main Menu</GameButton></div>
    </GamePanel>
  </div>;
}
