import GameButton from './ui/GameButton';
import GameIcon from './ui/GameIcon';
import GlassSurface from './ui/GlassSurface';
import './DifficultySelect.css';

const difficulties = [
  { id: 'easy', name: 'Easy', description: 'A forgiving first hunt', accent: 'secondary', icon: 'tutorial' },
  { id: 'normal', name: 'Normal', description: 'The intended field balance', accent: 'primary', icon: 'shield' },
  { id: 'hard', name: 'Hard', description: 'Pressure rises quickly', accent: 'gold', icon: 'zap' },
  { id: 'nightmare', name: 'Nightmare', description: 'No room for mistakes', accent: 'danger', icon: 'skull' },
];

export default function DifficultySelect({ onSelectDifficulty, onBack }) {
  return <main className="difficulty-shell"><header className="difficulty-topbar"><button className="text-action" onClick={onBack}><GameIcon name="back" size={20} /> BACK</button><span className="section-label">MISSION SETUP</span></header><div className="difficulty-content"><div className="difficulty-heading"><p className="section-label">SELECT THREAT LEVEL</p><h1>Choose your hunt</h1><p>Every mode changes the pressure on the field. Start where your instincts feel sharp.</p></div><div className="difficulty-options">{difficulties.map((difficulty) => <button key={difficulty.id} className={`difficulty-option difficulty-option--${difficulty.accent}`} onClick={() => onSelectDifficulty(difficulty.id)}><span className="difficulty-option__icon"><GameIcon name={difficulty.icon} size={27} /></span><span><strong>{difficulty.name}</strong><small>{difficulty.description}</small></span><GameIcon name="back" size={18} className="difficulty-option__arrow" /></button>)}</div><GlassSurface className="difficulty-note"><GameIcon name="info" size={20} /><p>Normal is the recommended first run. You can change your preference from Settings later.</p></GlassSurface></div></main>;
}
