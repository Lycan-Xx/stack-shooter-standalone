import { useState } from 'react';
import './UpgradeScreen.css';

const meta = {
  maxHealth: ['♥', 'SURVIVAL', 'green', 'MAX HEALTH +20'], damage: ['✦', 'OFFENSE', 'red', 'DAMAGE +15'],
  fireRate: ['⚡', 'WEAPON', 'blue', 'FIRE RATE +40'], speed: ['↯', 'MOBILITY', 'green', 'MOVE SPEED +0.5'],
  dashCooldown: ['◈', 'MOBILITY', 'gold', 'COOLDOWN -500MS'], piercing: ['◎', 'SPECIAL', 'purple', 'PIERCE +1 TARGET'],
};

export default function UpgradeScreen({ upgrades, onSelectUpgrade }) {
  const [selected, setSelected] = useState(null);
  const choose = (key) => { setSelected(key); window.setTimeout(() => onSelectUpgrade(key), 320); };
  return <div id="upgrade-screen" role="dialog" aria-modal="true" aria-labelledby="upgrade-title">
    <p className="upgrade-kicker">BOSS DEFEATED</p><h2 id="upgrade-title">CHOOSE YOUR UPGRADE</h2><p className="upgrade-subtitle">Your power grows in the dark.</p>
    <div id="upgrade-options">{upgrades.map((upgrade) => { const [icon, category, color, change] = meta[upgrade.key] || ['✦', 'UPGRADE', 'blue', upgrade.description.toUpperCase()]; return <button key={upgrade.key} className={`upgrade-card ${color} ${selected && selected !== upgrade.key ? 'dimmed' : ''} ${selected === upgrade.key ? 'selected' : ''}`} onClick={() => choose(upgrade.key)} disabled={Boolean(selected)}>
      <span className="upgrade-icon">{icon}</span><span className="upgrade-category">{category}</span><span className="upgrade-name">{upgrade.name.replace(/^\S+\s/, '')}</span><span className="upgrade-description">{upgrade.description}</span><span className="upgrade-change">{change}</span><span className="upgrade-level">LEVEL {upgrade.currentLevel} → {upgrade.currentLevel + 1}</span>
    </button>; })}</div>
  </div>;
}
