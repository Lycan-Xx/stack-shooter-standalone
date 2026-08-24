import './PauseMenu.css';
import GameButton from './ui/GameButton';
import GamePanel from './ui/GamePanel';

export default function PauseMenu({ onResume, onExit }) {
  return (
    <div id="pause-menu">
      <GamePanel className="pause-content">
        <h2>⏸️ PAUSED</h2>
        <p>Press ESC to resume</p>
        <div className="pause-buttons">
          <GameButton className="btn pause-btn" variant="primary" onClick={onResume}>
            ▶️ Resume Game
          </GameButton>
          <GameButton className="btn pause-btn secondary" variant="danger" onClick={onExit}>
            🚪 Exit Game
          </GameButton>
        </div>
      </GamePanel>
    </div>
  );
}
