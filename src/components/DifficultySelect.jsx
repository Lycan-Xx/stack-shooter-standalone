import './DifficultySelect.css';

export default function DifficultySelect({ onSelectDifficulty, onBack }) {
  const difficulties = [
    {
      id: 'easy',
      name: 'Easy',
      emoji: '😊',
      description: 'Perfect for beginners',
      color: '#4CAF50',
    },
    {
      id: 'normal',
      name: 'Normal',
      emoji: '😐',
      description: 'Balanced challenge',
      color: '#2196F3',
    },
    {
      id: 'hard',
      name: 'Hard',
      emoji: '😰',
      description: 'For experienced players',
      color: '#FF9800',
    },
    {
      id: 'nightmare',
      name: 'Nightmare',
      emoji: '💀',
      description: 'Ultimate challenge',
      color: '#F44336',
    },
  ];

  return (
    <div className="difficulty-select">
      <h2>Select Difficulty</h2>
      <p className="difficulty-subtitle">Choose your challenge level</p>

      <div className="difficulty-grid">
        {difficulties.map((diff) => (
          <button
            key={diff.id}
            className="difficulty-card"
            style={{ borderColor: diff.color }}
            onClick={() => onSelectDifficulty(diff.id)}
          >
            <div className="difficulty-emoji">{diff.emoji}</div>
            <div className="difficulty-name" style={{ color: diff.color }}>
              {diff.name}
            </div>
            <div className="difficulty-description">{diff.description}</div>
          </button>
        ))}
      </div>

      <button className="btn secondary-btn back-btn" onClick={onBack}>
        ← Back to Menu
      </button>
    </div>
  );
}
