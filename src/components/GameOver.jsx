import { useState, useEffect } from 'react';
import './GameOver.css';

export default function GameOver({ wave, kills, score, difficulty, onRestart, onMainMenu }) {
  const [personalBest, setPersonalBest] = useState(null);
  const [isNewBest, setIsNewBest] = useState(false);

  useEffect(() => {
    checkPersonalBest();
  }, []);

  const checkPersonalBest = () => {
    // Get personal best from localStorage
    const key = `best_${difficulty}`;
    const stored = localStorage.getItem(key);
    const best = stored ? parseInt(stored) : 0;

    setPersonalBest(best);

    if (score > best) {
      setIsNewBest(true);
      localStorage.setItem(key, score.toString());
    }
  };

  const getDifficultyEmoji = () => {
    const emojis = {
      easy: '😊',
      normal: '😐',
      hard: '😰',
      nightmare: '💀',
      tutorial: '📚',
    };
    return emojis[difficulty] || '😐';
  };

  const getDifficultyLabel = () => {
    return difficulty.toUpperCase();
  };

  return (
    <div id="game-over">
      <h2>💀 Game Over 💀</h2>

      {isNewBest && <div className="new-best-banner">🎉 NEW PERSONAL BEST! 🎉</div>}

      <div id="final-stats">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🌊</div>
            <div className="stat-value">{wave}</div>
            <div className="stat-label">Final Wave</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💀</div>
            <div className="stat-value">{kills}</div>
            <div className="stat-label">Total Kills</div>
          </div>

          <div className="stat-card highlight">
            <div className="stat-icon">⭐</div>
            <div className="stat-value">{score.toLocaleString()}</div>
            <div className="stat-label">Final Score</div>
          </div>
        </div>

        <div className="difficulty-display">
          <span className="difficulty-emoji">{getDifficultyEmoji()}</span>
          <span className="difficulty-text">{getDifficultyLabel()} MODE</span>
        </div>

        {personalBest > 0 && !isNewBest && (
          <div className="personal-best">
            Your Best ({getDifficultyLabel()}): {personalBest.toLocaleString()}
          </div>
        )}
      </div>

      <div className="game-over-buttons">
        <button className="btn primary-btn" onClick={onRestart}>
          🔄 Play Again
        </button>
        <button className="btn secondary-btn" onClick={onMainMenu}>
          🏠 Main Menu
        </button>
      </div>
    </div>
  );
}
