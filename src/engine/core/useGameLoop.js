// useGameLoop.js — React hook that drives the Rust/WASM game engine.
// All per-frame physics/AI/collision lives in Rust (engine/pkg). This file
// owns React state, input collection, audio, wave spawning, upgrades, the
// tutorial state machine, and Canvas 2D rendering (which reads flat
// f32 buffers exposed by the engine).

import { useEffect, useRef, useState } from 'react';
import { DIFFICULTY } from '../logic/difficulty.js';
import { drawVampire, drawBossVampire } from '../systems/svgCharacters.js';
import { RicochetEffect, drawPlayer } from '../systems/svgCharacters.js';
import { tutorialSteps } from '../logic/tutorial.js';
import { getRandomUpgrades, applyUpgrade } from '../logic/upgrades.js';
import { soundManager } from '../systems/sound.js';

import init, { Engine } from '../pkg/vampire_engine.js';
import wasmUrl from '../pkg/vampire_engine_bg.wasm?url';

// Engine-side bit flags (must mirror lib.rs)
const EV_PLAYER_HURT = 1 << 0;
const EV_GAME_OVER   = 1 << 1;

export function useGameLoop(canvasRef) {
  const [gameState, setGameState] = useState('start');
  const [hudData, setHudData] = useState({
    health: 100, maxHealth: 100,
    wave: 1, enemies: 0, kills: 0, score: 0,
    dashEnergy: 100, maxDashEnergy: 100,
    dashCooldown: 0, maxDashCooldown: 4000,
  });
  const [difficulty, setDifficulty] = useState('normal');
  const [difficultyBadge, setDifficultyBadge] = useState('😐 NORMAL MODE');
  const [upgradeOptions, setUpgradeOptions] = useState([]);
  const [tutorialText, setTutorialText] = useState('');
  const [wasdKeys, setWasdKeys] = useState(new Set());
  const [isPaused, setIsPaused] = useState(false);

  // Engine + WASM memory view (set after init)
  const engineRef = useRef(null);
  const memRef    = useRef(null);
  const readyRef  = useRef(false);

  // Game-meta state (lives in JS — not part of physics)
  const gameRef = useRef({
    state: 'start',
    wave: 1,
    kills: 0,
    score: 0,
    paused: false,
    difficulty: 'normal',
    challengeData: null,
    tutorialStep: 0,
    waveInProgress: false,
    waitingForNextWave: false,
    expectedEnemies: 0,
    spawnedEnemies: 0,
    isFirstGame: true,
    lasers: [],
    upgrades: {},        // { maxHealth: 2, damage: 1, ... }
    lastFrameMs: 0,
  });

  // Input refs
  const mouseRef = useRef({ x: 0, y: 0, down: false });
  const keysRef = useRef({});

  // Visual-only effect lists (small, kept in JS)
  const ricochetEffectsRef = useRef([]);

  // ── Engine init ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const wasm = await init({ module_or_path: wasmUrl });
      if (cancelled) return;
      engineRef.current = new Engine();
      memRef.current = wasm.memory;
      readyRef.current = true;
    })();
    window.joystickInput = { x: 0, y: 0 };
    return () => { cancelled = true; };
  }, []);

  // ── HUD sync (throttled) ─────────────────────────────────────────────
  let hudFrame = 0;
  const updateHUD = () => {
    const e = engineRef.current;
    const game = gameRef.current;
    if (!e) return;
    setHudData({
      health: e.player_health(),
      maxHealth: e.player_max_health(),
      wave: game.wave,
      enemies: e.enemies_len(),
      kills: game.kills,
      score: game.score,
      dashEnergy: e.player_dash_energy(),
      maxDashEnergy: e.player_max_dash_energy(),
      dashCooldown: e.player_dash_cooldown(),
      maxDashCooldown: e.player_max_dash_cooldown(),
      difficulty: game.difficulty,
    });
  };
  const throttledUpdateHUD = () => { if (++hudFrame % 3 === 0) updateHUD(); };

  // ── Wave spawning ────────────────────────────────────────────────────
  const showWaveInfo = (text) => {
    const el = document.getElementById('wave-info');
    if (el) {
      el.textContent = text;
      el.style.opacity = '1';
      setTimeout(() => { el.style.opacity = '0'; }, 2000);
    }
  };

  const computeChallengeMults = () => {
    let healthMult = 1, speedMult = 1, scoreMult = 1, enemyCountMult = 1,
        playerSpeedMult = 1, playerDamageMult = 1;
    const cd = gameRef.current.challengeData;
    if (cd?.modifiers) {
      cd.modifiers.forEach(m => {
        if (m.effect.enemyHealthMultiplier) healthMult *= m.effect.enemyHealthMultiplier;
        if (m.effect.enemySpeedMultiplier)  speedMult  *= m.effect.enemySpeedMultiplier;
        if (m.effect.scoreMultiplier)       scoreMult  *= m.effect.scoreMultiplier;
        if (m.effect.enemyCountMultiplier)  enemyCountMult *= m.effect.enemyCountMultiplier;
        if (m.effect.playerSpeedMultiplier) playerSpeedMult *= m.effect.playerSpeedMultiplier;
        if (m.effect.playerDamageMultiplier) playerDamageMult *= m.effect.playerDamageMultiplier;
      });
    }
    return { healthMult, speedMult, scoreMult, enemyCountMult, playerSpeedMult, playerDamageMult };
  };

  const spawnWave = () => {
    const game = gameRef.current;
    const canvas = canvasRef.current;
    const e = engineRef.current;
    if (!canvas || !e || game.waveInProgress) return;

    game.waveInProgress = true;
    game.waitingForNextWave = false;

    const diffKey = game.difficulty === 'challenge' ? 'normal' : game.difficulty;
    const diff = DIFFICULTY[diffKey];
    const mults = computeChallengeMults();

    const baseEnemies = (game.state === 'tutorial' && game.tutorialStep < 5)
      ? 1 : diff.enemiesPerWave;
    let numEnemies = Math.floor((baseEnemies + (game.wave - 1) * 0.5) * mults.enemyCountMult);

    const enemyHp = (diff.enemyHealth + Math.floor((game.wave - 1) * 5)) * mults.healthMult;
    const enemySpeed = (diff.enemySpeed + Math.min((game.wave - 1) * 0.03, 0.5)) * mults.speedMult;
    const enemyDamage = diff.enemyDamage;
    const score = 10 * diff.scoreMultiplier * mults.scoreMult;

    const isBossWave = game.wave % 3 === 0 && game.state === 'playing';

    if (isBossWave) {
      game.expectedEnemies = 1;
      game.spawnedEnemies = 0;
      const side = Math.floor(Math.random() * 4);
      let x, y;
      switch (side) {
        case 0: x = canvas.width / 2; y = -80; break;
        case 1: x = canvas.width + 80; y = canvas.height / 2; break;
        case 2: x = canvas.width / 2; y = canvas.height + 80; break;
        default: x = -80; y = canvas.height / 2;
      }
      const bossHp = enemyHp * numEnemies;
      const bossSpeed = enemySpeed * 0.7;
      const bossDmg = enemyDamage * 2;
      const bossScore = score * numEnemies;
      e.spawn_boss(x, y, bossHp, bossSpeed, bossDmg, bossScore);
      game.spawnedEnemies = 1;
      showWaveInfo(`⚔ BOSS WAVE ${game.wave} ⚔`);
    } else {
      game.expectedEnemies = numEnemies;
      game.spawnedEnemies = 0;
      for (let i = 0; i < numEnemies; i++) {
        setTimeout(() => {
          if ((game.state !== 'playing' && game.state !== 'tutorial') || !game.waveInProgress) return;
          const side = Math.floor(Math.random() * 4);
          let x, y;
          switch (side) {
            case 0: x = Math.random() * canvas.width; y = -50; break;
            case 1: x = canvas.width + 50; y = Math.random() * canvas.height; break;
            case 2: x = Math.random() * canvas.width; y = canvas.height + 50; break;
            default: x = -50; y = Math.random() * canvas.height;
          }
          e.spawn_vampire(x, y, enemyHp, enemySpeed, enemyDamage, score);
          game.spawnedEnemies++;
        }, i * 400);
      }
      showWaveInfo(`Wave ${game.wave}`);
    }
  };

  // ── Player setup helpers ─────────────────────────────────────────────
  const applyDifficultyToEngine = () => {
    const game = gameRef.current;
    const e = engineRef.current;
    if (!e) return;
    const diffKey = game.difficulty === 'challenge' ? 'normal' : game.difficulty;
    const diff = DIFFICULTY[diffKey];
    const mults = computeChallengeMults();
    e.set_player_stats(
      diff.playerHealth,
      diff.playerSpeed * mults.playerSpeedMult,
      diff.dashCooldown,
      diff.fireRate,
      diff.playerDamage * mults.playerDamageMult,
      0, // piercing reset
    );
  };

  const recomputePlayerStatsFromUpgrades = () => {
    // After applying an upgrade we re-derive the full stat block from the
    // base difficulty + upgrade levels and push to the engine.
    const game = gameRef.current;
    const e = engineRef.current;
    if (!e) return;
    const diffKey = game.difficulty === 'challenge' ? 'normal' : game.difficulty;
    const diff = DIFFICULTY[diffKey];
    const mults = computeChallengeMults();
    const u = game.upgrades;
    const lvl = (k) => u[k] || 0;

    const maxHp = 100 + lvl('maxHealth') * 20;
    const speed = 5 + lvl('speed') * 0.5;
    const dashCd = Math.max(1500, 4000 - lvl('dashCooldown') * 500);
    const fireRate = Math.max(100, 300 - lvl('fireRate') * 40);
    const damage = (50 + lvl('damage') * 15) * mults.playerDamageMult;
    const piercing = lvl('piercing');

    // For non-default difficulties, blend in difficulty base where no upgrade
    // has been taken. Mirrors the JS upgrade.effect closures.
    e.set_player_stats(
      Math.max(maxHp, diff.playerHealth),
      Math.max(speed, diff.playerSpeed * mults.playerSpeedMult),
      Math.min(dashCd, diff.dashCooldown),
      Math.min(fireRate, diff.fireRate),
      Math.max(damage, diff.playerDamage * mults.playerDamageMult),
      piercing,
    );
  };

  // ── Lifecycle ────────────────────────────────────────────────────────
  const initGame = () => {
    const e = engineRef.current;
    const game = gameRef.current;
    const canvas = canvasRef.current;
    if (!e || !canvas) return;

    game.state = 'playing';
    game.wave = 1;
    game.kills = 0;
    game.score = 0;
    game.waveInProgress = false;
    game.waitingForNextWave = false;
    game.expectedEnemies = 0;
    game.spawnedEnemies = 0;
    game.upgrades = {};
    game.lasers = [];

    e.set_canvas_size(canvas.width, canvas.height);
    applyDifficultyToEngine();
    e.reset_world();

    updateHUD();
    spawnWave();
  };

  const startGame = (selectedDifficulty, challengeData = null) => {
    const game = gameRef.current;
    soundManager.play('uiClick');

    if (challengeData) {
      game.difficulty = 'challenge';
      game.challengeData = challengeData;
      setDifficulty('challenge');
      setDifficultyBadge(`📅 ${challengeData.name.toUpperCase()}`);
    } else {
      game.difficulty = selectedDifficulty;
      game.challengeData = null;
      setDifficulty(selectedDifficulty);
      const badges = {
        easy: '😊 EASY MODE',
        normal: '😐 NORMAL MODE',
        hard: '😰 HARD MODE',
        nightmare: '💀 NIGHTMARE MODE',
      };
      setDifficultyBadge(badges[selectedDifficulty]);
    }

    setGameState('playing');
    game.state = 'playing';
    initGame();
    soundManager.playMusic();
  };

  const startTutorialMode = () => {
    const game = gameRef.current;
    soundManager.play('uiClick');
    game.state = 'tutorial';
    game.difficulty = 'tutorial';
    game.tutorialStep = 0;
    setGameState('tutorial');
    setDifficulty('tutorial');
    setDifficultyBadge('📚 TUTORIAL');
    initGame();
    soundManager.playMusic();
    setTutorialText(tutorialSteps[0].text);
  };

  const continTutorial = () => {
    const game = gameRef.current;
    const e = engineRef.current;
    soundManager.play('uiClick');
    game.tutorialStep++;
    if (game.tutorialStep >= tutorialSteps.length) {
      setGameState('playing');
      game.state = 'playing';
      game.difficulty = 'easy';
      game.wave = 1;
      game.waveInProgress = false;
      game.waitingForNextWave = false;
      setDifficulty('easy');
      setDifficultyBadge('😊 EASY MODE');
      const diff = DIFFICULTY['easy'];
      e.set_player_stats(diff.playerHealth, diff.playerSpeed,
        diff.dashCooldown, diff.fireRate, diff.playerDamage, 0);
      updateHUD();
      spawnWave();
      return;
    }
    setTutorialText(tutorialSteps[game.tutorialStep].text);
  };

  const showUpgradeScreen = () => {
    const game = gameRef.current;
    const upgrades = getRandomUpgrades(game.upgrades, 3);
    setUpgradeOptions(upgrades);
    setGameState('upgrade');
  };

  const selectUpgrade = (upgradeKey) => {
    const game = gameRef.current;
    // Track upgrade level via plain object (so existing UI components keep working)
    const fakePlayer = {
      maxHealth: 100, health: 100,
      speed: 5,
      weapon: { damage: 50, fireRate: 300, piercing: 0 },
      maxDashCooldown: 4000,
      upgrades: game.upgrades,
    };
    applyUpgrade(fakePlayer, game.upgrades, upgradeKey);
    recomputePlayerStatsFromUpgrades();
    // Vitality also grants instant heal
    if (upgradeKey === 'maxHealth') {
      const e = engineRef.current;
      e.add_max_health(fakePlayer.maxHealth, 20);
    }

    setGameState('playing');
    game.state = 'playing';
    setTimeout(() => {
      game.wave++;
      updateHUD();
      spawnWave();
    }, 500);
  };

  const performDash = () => {
    const game = gameRef.current;
    const e = engineRef.current;
    if (!e || (game.state !== 'playing' && game.state !== 'tutorial')) return false;
    if (e.try_dash()) {
      soundManager.play('dash');
      setTimeout(() => e.end_dash(), 200);
      return true;
    }
    return false;
  };

  const restartGame = () => {
    soundManager.play('uiClick');
    setGameState('start');
    gameRef.current.state = 'start';
    setIsPaused(false);
    gameRef.current.paused = false;
    const e = engineRef.current;
    if (e) e.clear_enemies();
  };

  const togglePause = () => {
    const game = gameRef.current;
    if (game.state !== 'playing' && game.state !== 'tutorial') return;
    game.paused = !game.paused;
    setIsPaused(game.paused);
    soundManager.play('uiClick');
    if (game.paused) soundManager.stopMusic(); else soundManager.playMusic();
  };

  const gameOver = () => {
    const game = gameRef.current;
    game.state = 'gameOver';
    setGameState('gameOver');
    soundManager.play('gameOver');
    soundManager.stopMusic();
  };

  // ── Per-frame update via WASM ────────────────────────────────────────
  const stepFrame = (dtMs) => {
    const game = gameRef.current;
    const canvas = canvasRef.current;
    const e = engineRef.current;
    const mouse = mouseRef.current;
    const keys = keysRef.current;
    if (!canvas || !e) return;
    if ((game.state !== 'playing' && game.state !== 'tutorial') || game.paused) return;

    // Input vector
    const joy = window.joystickInput || { x: 0, y: 0 };
    let mx = (keys['d'] || keys['D'] || keys['arrowright'] ? 1 : 0)
           - (keys['a'] || keys['A'] || keys['arrowleft']  ? 1 : 0);
    let my = (keys['s'] || keys['S'] || keys['arrowdown']  ? 1 : 0)
           - (keys['w'] || keys['W'] || keys['arrowup']    ? 1 : 0);
    if (Math.abs(joy.x) > 0.2 || Math.abs(joy.y) > 0.2) { mx = joy.x; my = joy.y; }

    // Aiming vector (Twin stick overrides mouse)
    const aimJoy = window.aimJoystickInput || { x: 0, y: 0 };
    let targetX = mouse.x;
    let targetY = mouse.y;
    if (Math.abs(aimJoy.x) > 0.1 || Math.abs(aimJoy.y) > 0.1) {
      targetX = e.player_x() + aimJoy.x * 1000;
      targetY = e.player_y() + aimJoy.y * 1000;
    }

    // Step engine
    const ev = e.step(dtMs, mx, my, targetX, targetY);
    const bits = ev.bits;
    const shake = ev.shake;
    ev.free();

    if (bits & EV_PLAYER_HURT) {
      soundManager.play('playerHurt');
      if (shake > 0) {
        canvas.style.transform = `translate(${(Math.random() * 2 - 1) * shake}px, ${(Math.random() * 2 - 1) * shake}px)`;
        setTimeout(() => { canvas.style.transform = ''; }, 60);
      }
    }
    if (bits & EV_GAME_OVER) {
      gameOver();
      return;
    }

    // Shoot
    if (mouse.down || window.mobileFireActive) {
      const r = e.fire_hitscan();
      if (r !== 0xFFFFFFFF) {
        // Fired this frame
        if (r > 0) {
          // Process per-hit results (sounds, ricochets, score)
          const playerX = e.player_x(), playerY = e.player_y();
          const angle = e.player_angle();
          let killCount = 0, scoreSum = 0;
          for (let i = 0; i < r; i++) {
            const killed = e.hit_killed(i);
            if (killed) {
              killCount++;
              scoreSum += e.hit_score(i);
              soundManager.play('enemyDeath');
              soundManager.play('scorePoint');
            } else {
              soundManager.play('enemyHit');
              ricochetEffectsRef.current.push(
                new RicochetEffect(e.hit_x(i), e.hit_y(i), e.hit_angle(i))
              );
            }
          }
          if (killCount > 0) {
            game.kills += killCount;
            game.score += scoreSum;
          }
        }
        soundManager.play('shoot');
        // Visual laser
        const playerX = e.player_x(), playerY = e.player_y();
        const angle = e.player_angle();
        const len = 1000;
        game.lasers.push({
          startX: playerX, startY: playerY,
          endX: playerX + Math.cos(angle) * len,
          endY: playerY + Math.sin(angle) * len,
          alpha: 1, createdAt: performance.now(),
        });
      }
    }

    // Update visual-only ricochets
    const rico = ricochetEffectsRef.current;
    if (rico.length > 20) rico.splice(0, rico.length - 20);
    for (let i = rico.length - 1; i >= 0; i--) {
      if (!rico[i].update()) rico.splice(i, 1);
    }

    throttledUpdateHUD();

    // Wave completion
    const allSpawned = game.spawnedEnemies >= game.expectedEnemies;
    if (e.enemies_len() === 0 && game.waveInProgress
        && !game.waitingForNextWave && allSpawned) {
      game.waveInProgress = false;
      game.waitingForNextWave = true;
      e.heal_full();
      updateHUD();
      soundManager.play('waveComplete');
      const diffKey = game.difficulty === 'challenge' ? 'normal' : game.difficulty;
      const bonus = 50 * DIFFICULTY[diffKey].scoreMultiplier;
      if (bonus > 0) {
        game.score += bonus;
        updateHUD();
        e.add_floating_text(canvas.width / 2, canvas.height / 2,
          `Wave Complete! +${bonus}`, '#4CAF50');
      } else {
        e.add_floating_text(canvas.width / 2, canvas.height / 2,
          'Wave Complete!', '#4CAF50');
      }
      if (game.wave % 3 === 0 && game.state === 'playing') {
        showUpgradeScreen();
      } else {
        setTimeout(() => {
          if ((game.state === 'playing' || game.state === 'tutorial') && game.waitingForNextWave) {
            game.wave++;
            game.waitingForNextWave = false;
            updateHUD();
            if (game.state === 'tutorial') continTutorial(); else spawnWave();
          }
        }, 2000);
      }
    }
  };

  // ── Drawing — reads from WASM memory ────────────────────────────────
  const draw = () => {
    const game = gameRef.current;
    const canvas = canvasRef.current;
    const e = engineRef.current;
    const mem = memRef.current;
    if (!canvas || !e || !mem) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (game.state !== 'playing' && game.state !== 'tutorial') return;

    e.build_render_buffers();

    const playerX = e.player_x();
    const playerY = e.player_y();
    const playerSize = e.player_size();
    const playerAngle = e.player_angle();
    const playerDashing = e.player_is_dashing();
    const mouse = mouseRef.current;

    // Aim line
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(playerX, playerY);
    ctx.lineTo(mouse.x, mouse.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Player
    drawPlayer(ctx, playerX, playerY, playerSize, playerAngle, playerDashing);

    // Blood splatters first (behind enemies)
    const bloodLen = e.blood_len();
    if (bloodLen > 0) {
      const bStride = e.blood_stride();
      const bloodView = new Float32Array(mem.buffer, e.blood_ptr(), bloodLen * bStride);
      ctx.save();
      ctx.fillStyle = '#8b0000';
      for (let i = 0; i < bloodLen; i++) {
        const o = i * bStride;
        const x = bloodView[o], y = bloodView[o + 1],
              r = bloodView[o + 2], a = bloodView[o + 3];
        ctx.globalAlpha = a;
        // Main splat circle
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        // 3 pre-baked satellite blobs — matches original BloodSplatter.draw()
        for (let s = 0; s < 3; s++) {
          const so = o + 4 + s * 3;
          const ox = bloodView[so], oy = bloodView[so + 1], sr = bloodView[so + 2];
          ctx.beginPath(); ctx.arc(x + ox, y + oy, sr, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Enemies
    const enemyLen = e.enemies_len();
    if (enemyLen > 0) {
      const stride = e.enemy_stride();
      const view = new Float32Array(mem.buffer, e.enemies_ptr(), enemyLen * stride);
      for (let i = 0; i < enemyLen; i++) {
        const o = i * stride;
        const x = view[o], y = view[o + 1], radius = view[o + 2], size = view[o + 3];
        const hp = view[o + 4], maxHp = view[o + 5];
        const isBoss = view[o + 6] > 0.5;
        const facingLeft = view[o + 7] > 0.5;
        const isCharging = view[o + 8] > 0.5;
        if (isBoss) {
          drawBossVampire(ctx, x, y, size, facingLeft, hp / maxHp, performance.now());
          // Boss bar
          const bw = 80, bh = 8;
          ctx.fillStyle = 'rgba(50,0,0,0.9)';
          ctx.fillRect(x - bw / 2, y - size / 2 - 25, bw, bh);
          const pct = hp / maxHp;
          ctx.fillStyle = pct > 0.66 ? '#c41e3a' : pct > 0.33 ? '#ff6600' : '#ff0000';
          ctx.fillRect(x - bw / 2, y - size / 2 - 25, pct * bw, bh);
          ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 2;
          ctx.strokeRect(x - bw / 2, y - size / 2 - 25, bw, bh);
          ctx.fillStyle = '#ffcc00';
          ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center';
          ctx.fillText('⚔ BOSS ⚔', x, y - size / 2 - 30);
          if (isCharging) {
            ctx.strokeStyle = 'rgba(255,0,0,0.6)';
            ctx.lineWidth = 3; ctx.setLineDash([5, 5]);
            ctx.beginPath(); ctx.arc(x, y, radius + 10, 0, Math.PI * 2); ctx.stroke();
            ctx.setLineDash([]);
          }
        } else {
          drawVampire(ctx, x, y, size, facingLeft, hp / maxHp);
          if (hp < maxHp) {
            const bw = 50, bh = 6;
            const bx = x - bw / 2, by = y - size / 2 - 15;
            ctx.fillStyle = 'rgba(50,0,0,0.8)';
            ctx.fillRect(bx, by, bw, bh);
            ctx.fillStyle = '#c41e3a';
            ctx.fillRect(bx, by, (hp / maxHp) * bw, bh);
            ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
            ctx.strokeRect(bx, by, bw, bh);
          }
        }
      }
    }

    // Lasers
    if (game.lasers && game.lasers.length) {
      const now = performance.now();
      game.lasers = game.lasers.filter(l => {
        const age = now - l.createdAt;
        if (age > 100) return false;
        l.alpha = 1 - age / 100;
        ctx.save();
        ctx.globalAlpha = l.alpha;
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10; ctx.shadowColor = '#ffff00';
        ctx.beginPath();
        ctx.moveTo(l.startX, l.startY); ctx.lineTo(l.endX, l.endY);
        ctx.stroke();
        ctx.restore();
        return true;
      });
    }

    // Particles
    const partLen = e.particles_len();
    if (partLen > 0) {
      const stride = e.particle_stride();
      const view = new Float32Array(mem.buffer, e.particles_ptr(), partLen * stride);
      ctx.save();
      for (let i = 0; i < partLen; i++) {
        const o = i * stride;
        const x = view[o], y = view[o + 1], r = view[o + 2], a = view[o + 3];
        const cr = view[o + 4], cg = view[o + 5], cb = view[o + 6];
        ctx.globalAlpha = Math.max(0, a);
        ctx.fillStyle = `rgb(${(cr * 255) | 0},${(cg * 255) | 0},${(cb * 255) | 0})`;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Floating texts
    const tcount = e.texts_count();
    if (tcount > 0) {
      ctx.save();
      ctx.font = 'bold 24px Arial'; ctx.textAlign = 'center';
      ctx.lineWidth = 3; ctx.strokeStyle = '#000';
      for (let i = 0; i < tcount; i++) {
        const a = e.text_alpha(i);
        const x = e.text_x(i), y = e.text_y(i);
        const text = e.text_str(i);
        const color = e.text_color(i);
        ctx.globalAlpha = Math.max(0, a);
        ctx.fillStyle = color;
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Ricochets (JS-side visual)
    ricochetEffectsRef.current.forEach(r => r.draw(ctx));
  };

  // ── RAF loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    let raf;
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(now - last, 50);
      last = now;
      if (readyRef.current) {
        stepFrame(dt);
        draw();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ── Canvas resize ────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const e = engineRef.current;
      if (e) e.set_canvas_size(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ── Input listeners ──────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleKeyDown = (e) => {
      keysRef.current[e.key] = true;
      keysRef.current[e.key.toLowerCase()] = true;
      setWasdKeys(prev => new Set([...prev, e.code]));
      if (e.ctrlKey && e.key === 'l') e.preventDefault();
      if (e.key === 'Escape') { e.preventDefault(); togglePause(); return; }
      if (e.key === ' ' || e.code === 'Space') {
        if (performDash()) e.preventDefault();
      }
    };
    const handleKeyUp = (e) => {
      keysRef.current[e.key] = false;
      keysRef.current[e.key.toLowerCase()] = false;
      setWasdKeys(prev => { const n = new Set(prev); n.delete(e.code); return n; });
    };
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      const ch = document.getElementById('crosshair');
      if (ch) { ch.style.left = e.clientX + 'px'; ch.style.top = e.clientY + 'px'; }
    };
    const handleMouseDown = () => { mouseRef.current.down = true; };
    const handleMouseUp = () => { mouseRef.current.down = false; };
    const handleTouchStart = (ev) => {
      const t = ev.touches[0];
      const j = document.getElementById('joystick-container');
      const d = document.getElementById('mobile-dash');
      if (j && d) {
        const jr = j.getBoundingClientRect(), dr = d.getBoundingClientRect();
        const tx = t.clientX, ty = t.clientY;
        const onJoy = tx >= jr.left && tx <= jr.right && ty >= jr.top && ty <= jr.bottom;
        const onDash = tx >= dr.left && tx <= dr.right && ty >= dr.top && ty <= dr.bottom;
        if (!onJoy && !onDash) {
          const rect = canvas.getBoundingClientRect();
          mouseRef.current.x = t.clientX - rect.left;
          mouseRef.current.y = t.clientY - rect.top;
          mouseRef.current.down = true;
        }
      }
    };
    const handleTouchMove = (ev) => {
      const t = ev.touches[0];
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = t.clientX - rect.left;
      mouseRef.current.y = t.clientY - rect.top;
    };
    const handleTouchEnd = (ev) => { if (ev.touches.length === 0) mouseRef.current.down = false; };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return {
    gameState, hudData, difficulty, difficultyBadge,
    upgradeOptions, tutorialText, wasdKeys, isPaused,
    startGame, startTutorialMode, continTutorial, restartGame,
    selectUpgrade, performDash, togglePause,
  };
}
