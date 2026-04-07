// Upgrade system - Vampire Survivors style

export const UPGRADES = {
  maxHealth: {
    name: '❤️ Vitality',
    description: 'Increase max health',
    maxLevel: 5,
    effect: (player, level) => {
      player.maxHealth = 100 + level * 20;
      player.health = Math.min(player.health + 20, player.maxHealth);
    },
  },
  damage: {
    name: '💥 Firepower',
    description: 'Increase bullet damage',
    maxLevel: 5,
    effect: (player, level) => {
      player.weapon.damage = 50 + level * 15;
    },
  },
  fireRate: {
    name: '⚡ Rapid Fire',
    description: 'Shoot faster',
    maxLevel: 5,
    effect: (player, level) => {
      player.weapon.fireRate = Math.max(100, 300 - level * 40);
    },
  },
  speed: {
    name: '🏃 Agility',
    description: 'Move faster',
    maxLevel: 5,
    effect: (player, level) => {
      player.speed = 5 + level * 0.5;
    },
  },
  dashCooldown: {
    name: '💨 Quick Dash',
    description: 'Reduce dash cooldown',
    maxLevel: 5,
    effect: (player, level) => {
      player.maxDashCooldown = Math.max(1500, 4000 - level * 500);
    },
  },
  piercing: {
    name: '🎯 Piercing Shots',
    description: 'Bullets pierce enemies',
    maxLevel: 3,
    effect: (player, level) => {
      player.weapon.piercing = level;
    },
  },
};

export function getRandomUpgrades(playerUpgrades, count = 3) {
  const available = [];

  for (const [key, upgrade] of Object.entries(UPGRADES)) {
    const currentLevel = playerUpgrades[key] || 0;
    if (currentLevel < upgrade.maxLevel) {
      available.push({
        key,
        ...upgrade,
        currentLevel,
      });
    }
  }

  // Shuffle and take count
  const shuffled = available.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function applyUpgrade(player, playerUpgrades, upgradeKey) {
  const upgrade = UPGRADES[upgradeKey];
  if (!upgrade) return;

  const currentLevel = playerUpgrades[upgradeKey] || 0;
  if (currentLevel >= upgrade.maxLevel) return;

  playerUpgrades[upgradeKey] = currentLevel + 1;
  upgrade.effect(player, playerUpgrades[upgradeKey]);
}
