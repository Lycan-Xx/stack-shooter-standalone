import './PauseMenu.css';

export default function PauseMenu({ onResume, onExit }) {
  return (
    <div id="pause-menu">
      <div className="pause-content">
        <h2>⏸️ PAUSED</h2>
        <p>Press ESC to resume</p>
        <div className="pause-buttons">
          <button className="btn pause-btn" onClick={onResume}>
            ▶️ Resume Game
          </button>
          <button className="btn pause-btn secondary" onClick={onExit}>
            🚪 Exit Game
          </button>
        </div>
      </div>
    </div>
  );
}
