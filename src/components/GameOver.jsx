import { useState, useEffect } from 'react';
import { gameStorage } from '../engine/systems/gameStorage.js';
import './GameOver.css';

export default function GameOver({ wave, kills, score, difficulty, onRestart, onMainMenu }) {
  const [personalBest, setPersonalBest] = useState(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const [rank, setRank] = useState(0);

  useEffect(() => {
    checkPersonalBest();
  }, []);

  const checkPersonalBest = () => {
    // Get personal best and high score rank from gameStorage
    const best = gameStorage.getBestScore(difficulty);
    setPersonalBest(best);

    if (score > best) {
      setIsNewBest(true);
      const newRank = gameStorage.addHighScore(difficulty, { score, wave });
      setRank(newRank);
    } else {
      // Check if already a high score
      if (gameStorage.isHighScore(difficulty, score)) {
        const newRank = gameStorage.addHighScore(difficulty, { score, wave });
        setRank(newRank);
      }
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

      {isNewBest && rank > 0 && (
        <div className="new-best-banner">🏆 #{rank} NEW HIGH SCORE! 🏆</div>
      )}
      {isNewBest && rank === 0 && (
        <div className="new-best-banner">🎉 NEW PERSONAL BEST! 🎉</div>
      )}

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
