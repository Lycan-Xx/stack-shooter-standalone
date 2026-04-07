// Tutorial system
import { DIFFICULTY } from './difficulty.js';
import { soundManager } from './sound.js';
export const tutorialSteps = [
  {
    text: "Welcome, Hunter! 🧛\n\nVampires are attacking! Let's learn how to survive.\n\nUse WASD or Arrow Keys to move around.",
    action: () => true,
  },
  {
    text: "Great! Now let's learn to shoot.\n\nMove your mouse to aim, and CLICK to fire at the vampire!",
    action: () => true,
  },
  {
    text: "Excellent shooting! 🎯\n\nNow the most important skill: DASHING!\n\nPress SPACEBAR to dash. You're invincible while dashing!",
    action: () => true,
  },
  {
    text: "Perfect! Remember: vampires can't hurt you while dashing.\n\nUse this to escape when surrounded!\n\nDefeat this wave to continue.",
    action: () => true,
  },
  {
    text: "You're ready! 🌟\n\nTips:\n- Watch your health (top left)\n- Dash has a cooldown (bottom)\n- Kill vampires for points\n\nGood luck, Hunter!",
    action: () => true,
  },
];

export function nextTutorialStep(game, player, updateHUD, spawnWave) {
  game.tutorialStep++;

  if (game.tutorialStep >= tutorialSteps.length) {
    document.getElementById('tutorial-overlay').style.display = 'none';
    game.state = 'playing';
    game.difficulty = 'easy';
    game.wave = 1;
    game.waveInProgress = false;
    game.waitingForNextWave = false;

    document.getElementById('difficulty-badge').textContent = '😊 EASY MODE';

    const diff = DIFFICULTY['easy'];
    player.maxHealth = diff.playerHealth;
    player.health = diff.playerHealth;
    player.speed = diff.playerSpeed;
    player.weapon.fireRate = diff.fireRate;
    player.maxDashCooldown = diff.dashCooldown;

    updateHUD();
    spawnWave();
    return;
  }

  const step = tutorialSteps[game.tutorialStep];
  document.getElementById('tutorial-text').textContent = step.text;
  document.getElementById('tutorial-overlay').style.display = 'block';
}

export function startTutorial(game, initGame) {
  game.state = 'tutorial';
  game.difficulty = 'tutorial';
  game.tutorialStep = 0;
  initGame();
  soundManager.playMusic();

  document.getElementById('tutorial-text').textContent = tutorialSteps[0].text;
  document.getElementById('tutorial-overlay').style.display = 'block';
}
