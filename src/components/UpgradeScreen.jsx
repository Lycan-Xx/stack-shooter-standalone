import { useState } from 'react';
import GameIcon from './ui/GameIcon';
import OverlaySheet from './ui/OverlaySheet';
import './UpgradeScreen.css';

const meta = { maxHealth: ['heart', 'SURVIVAL', 'secondary', 'MAX HEALTH +20'], damage: ['zap', 'OFFENSE', 'danger', 'DAMAGE +15'], fireRate: ['zap', 'WEAPON', 'primary', 'FIRE RATE +40'], speed: ['back', 'MOBILITY', 'secondary', 'MOVE SPEED +0.5'], dashCooldown: ['zap', 'MOBILITY', 'gold', 'COOLDOWN -500MS'], piercing: ['shield', 'SPECIAL', 'purple', 'PIERCE +1 TARGET'] };

export default function UpgradeScreen({ upgrades, onSelectUpgrade }) {
  const [selected, setSelected] = useState(null);
  const choose = (key) => { setSelected(key); window.setTimeout(() => onSelectUpgrade(key), 320); };
  return <OverlaySheet title="Choose your upgrade" kicker="BOSS DEFEATED" className="upgrade-sheet"><p className="upgrade-subtitle">Your power grows in the dark.</p><div id="upgrade-options">{upgrades.map((upgrade) => { const [icon, category, color, change] = meta[upgrade.key] || ['zap', 'UPGRADE', 'primary', upgrade.description.toUpperCase()]; return <button key={upgrade.key} className={`upgrade-option upgrade-option--${color} ${selected && selected !== upgrade.key ? 'is-dimmed' : ''} ${selected === upgrade.key ? 'is-selected' : ''}`} onClick={() => choose(upgrade.key)} disabled={Boolean(selected)}><span className="upgrade-option__icon"><GameIcon name={icon} size={26} /></span><span className="upgrade-option__category">{category}</span><strong>{upgrade.name.replace(/^\S+\s/, '')}</strong><small>{upgrade.description}</small><em>{change}</em><span className="upgrade-option__level">LEVEL {upgrade.currentLevel} → {upgrade.currentLevel + 1}</span></button>; })}</div></OverlaySheet>;
}
