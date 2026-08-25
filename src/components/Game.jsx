import { useEffect, useRef, useState } from 'react';
import { useGameLoop } from '../engine/core/useGameLoop';
import HUD from './HUD';
import StartScreen from './StartScreen';
import GameOver from './GameOver';
import UpgradeScreen from './UpgradeScreen';
import TutorialOverlay from './TutorialOverlay';
import PauseMenu from './PauseMenu';
import Controls from './Controls';
import './Game.css';

export default function Game() {
  const canvasRef = useRef(null);
  const [exitHint, setExitHint] = useState(false);

  const {
    gameState,
    hudData,
    upgradeOptions,
    tutorialText,
    wasdKeys,
    isPaused,
    startGame,
    startTutorialMode,
    continTutorial,
    restartGame,
    selectUpgrade,
    performDash,
    togglePause,
  } = useGameLoop(canvasRef);

  useEffect(() => {
    const showExitHint = () => {
      setExitHint(true);
      window.setTimeout(() => setExitHint(false), 2200);
    };
    window.addEventListener('app-exit-warning', showExitHint);
    return () => window.removeEventListener('app-exit-warning', showExitHint);
  }, []);

  return (
    <div id="game-container" className={`game-shell game-shell--${gameState}`} data-game-state={gameState}>
      <canvas ref={canvasRef} id="game-canvas"></canvas>

      <div id="ui-overlay" className="game-shell__overlay">
        {exitHint && <div className="system-message" role="status">Press back again to exit Stack Shooter</div>}
        {(gameState === 'playing' || gameState === 'tutorial') && (
          <>
            <HUD {...hudData} />
          </>
        )}

        <div id="wave-info" aria-live="polite"></div>

        {gameState === 'start' && (
          <StartScreen
            onStartGame={startGame}
            onStartTutorial={startTutorialMode}
          />
        )}

        {gameState === 'gameOver' && (
          <GameOver
            wave={hudData.wave}
            kills={hudData.kills}
            score={hudData.score}
            durationMs={hudData.durationMs}
            difficulty={hudData.difficulty || 'normal'}
            onRestart={restartGame}
            onMainMenu={restartGame}
          />
        )}

        {gameState === 'upgrade' && (
          <UpgradeScreen upgrades={upgradeOptions} onSelectUpgrade={selectUpgrade} />
        )}

        {gameState === 'tutorial' && tutorialText && (
          <TutorialOverlay text={tutorialText} onContinue={continTutorial} />
        )}

        {isPaused && (gameState === 'playing' || gameState === 'tutorial') && (
          <PauseMenu 
            onResume={togglePause}
            onRestart={restartGame}
            onMainMenu={restartGame}
            stats={hudData}
          />
        )}
      </div>

      {(gameState === 'playing' || gameState === 'tutorial') && (
        <Controls performDash={performDash} wasdKeys={wasdKeys} togglePause={togglePause} />
      )}
    </div>
  );
}
