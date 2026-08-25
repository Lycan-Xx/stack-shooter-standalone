import GameButton from './ui/GameButton';
import GameIcon from './ui/GameIcon';
import './TutorialOverlay.css';

export default function TutorialOverlay({ text, onContinue }) {
  return <section id="tutorial-overlay" role="dialog" aria-modal="true" aria-labelledby="tutorial-title"><div className="tutorial-heading"><GameIcon name="tutorial" size={24} /><div><p className="section-label">FIELD TRAINING</p><h2 id="tutorial-title">Tutorial</h2></div></div><p id="tutorial-text">{text}</p><GameButton variant="primary" onClick={onContinue}>Continue <GameIcon name="back" size={17} className="tutorial-arrow" /></GameButton></section>;
}
