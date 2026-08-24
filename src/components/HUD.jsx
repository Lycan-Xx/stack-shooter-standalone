import './HUD.css';

export default function HUD({ health, maxHealth, wave, enemies, kills, score, dashEnergy, maxDashEnergy, dashCooldown, maxDashCooldown, powerUps = [] }) {
  const healthPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const energyPercent = Math.max(0, Math.min(100, (dashEnergy / maxDashEnergy) * 100));
  const dashPercent = Math.max(0, Math.min(100, 100 - (dashCooldown / maxDashCooldown) * 100));
  const healthCritical = healthPercent < 30;
  const dashReady = dashCooldown <= 0;

  return (
    <div id="hud" aria-label="Combat status">
      <div className="hud-cluster hud-vitals">
        <div className={`hud-meter hud-health ${healthCritical ? 'is-critical' : ''}`}>
          <div className="hud-meter-heading"><span>♥</span> HEALTH</div>
          <div className="hud-meter-track" role="progressbar" aria-valuenow={health} aria-valuemin="0" aria-valuemax={maxHealth}><div className="hud-meter-fill" style={{ width: `${healthPercent}%` }} /></div>
          <div className="hud-meter-value">{Math.max(0, Math.floor(health))} <span>/ {maxHealth}</span></div>
        </div>
        <div className="hud-meter hud-energy">
          <div className="hud-meter-heading"><span>ϟ</span> ENERGY</div>
          <div className="hud-meter-track" role="progressbar" aria-valuenow={dashEnergy} aria-valuemin="0" aria-valuemax={maxDashEnergy}><div className="hud-meter-fill" style={{ width: `${energyPercent}%` }} /></div>
          <div className="hud-meter-value">{Math.floor(dashEnergy)} <span>/ {maxDashEnergy}</span></div>
        </div>
      </div>
      <div className="hud-cluster hud-run-info">
        <div className="hud-score">{score.toLocaleString()}</div>
        <div className="hud-wave-label">WAVE <strong>{wave}</strong></div>
        <div className="hud-enemies"><span>☠</span> ENEMIES <strong>{enemies}</strong></div>
        <div className="hud-secondary-stats"><span>KILLS {kills}</span><span className="hud-dash-status">{dashReady ? 'DASH READY' : `DASH ${Math.ceil(dashCooldown / 1000)}s`}</span></div>
        <div className="hud-dash-track" aria-hidden="true"><div style={{ width: `${dashPercent}%` }} /></div>
      </div>
      {powerUps.length > 0 && <div id="powerup-indicators" aria-label="Active power-ups">{powerUps.map((powerUp, index) => <div key={index} className={`powerup-indicator powerup-${powerUp.type}`}>{powerUp.type === 'speed' && 'ϟ'}{powerUp.type === 'shield' && '◈'}{powerUp.type === 'fireRate' && '✦'}</div>)}</div>}
    </div>
  );
}
