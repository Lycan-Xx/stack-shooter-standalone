import './UpgradeScreen.css';

export default function UpgradeScreen({ upgrades, onSelectUpgrade }) {
  return (
    <div id="upgrade-screen">
      <h2>⭐ Level Up! ⭐</h2>
      <p>Choose an upgrade to enhance your abilities</p>
      <div id="upgrade-options">
        {upgrades.map((upgrade) => (
          <div
            key={upgrade.key}
            className="upgrade-card"
            onClick={() => onSelectUpgrade(upgrade.key)}
          >
            <div className="upgrade-icon">{upgrade.name.split(' ')[0]}</div>
            <div className="upgrade-name">{upgrade.name}</div>
            <div className="upgrade-description">{upgrade.description}</div>
            <div className="upgrade-level">
              Level {upgrade.currentLevel} → {upgrade.currentLevel + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
