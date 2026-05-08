import './TutorialOverlay.css';

export default function TutorialOverlay({ text, onContinue }) {
  return (
    <div id="tutorial-overlay">
      <h3>🎯 Tutorial</h3>
      <p id="tutorial-text">{text}</p>
      <button className="btn" onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}
