/**
 * Boss enemy - spawns every 3rd wave instead of normal enemies
 * Has combined health and firepower of all enemies that would have spawned
 */
import { DIFFICULTY } from '../logic/difficulty.js';
import { soundManager } from '../systems/sound.js';
import { drawBossVampire } from '../systems/svgCharacters.js';

export class BossVampire {
  constructor(x, y, wave, difficulty, player, numEnemiesReplaced, challengeData = null) {
    this.x = x;
    this.y = y;
    this.radius = 50;
    this.size = 100;
    this.player = player;
    this.isBoss = true;

    const diff = difficulty === 'challenge' ? DIFFICULTY.normal : DIFFICULTY[difficulty];

    let healthMult = 1.0;
    let speedMult = 1.0;
    let scoreMult = diff.scoreMultiplier;

    if (challengeData && challengeData.modifiers) {
      challengeData.modifiers.forEach(mod => {
        if (mod.effect.enemyHealthMultiplier) healthMult *= mod.effect.enemyHealthMultiplier;
        if (mod.effect.enemySpeedMultiplier) speedMult *= mod.effect.enemySpeedMultiplier;
        if (mod.effect.scoreMultiplier) scoreMult *= mod.effect.scoreMultiplier;
      });
    }

    // Combined health of all enemies that would have spawned
    const singleEnemyHealth = (diff.enemyHealth + Math.floor((wave - 1) * 5)) * healthMult;
    this.health = singleEnemyHealth * numEnemiesReplaced;
    this.maxHealth = this.health;

    // Slightly slower but hits harder
    this.speed = (diff.enemySpeed + Math.min((wave - 1) * 0.03, 0.5)) * speedMult * 0.7;
    this.damage = diff.enemyDamage * 2;
    this.lastAttack = 0;
    this.attackRate = 800;
    this.scoreValue = 10 * scoreMult * numEnemiesReplaced;

    // Boss abilities
    this.lastAbility = 0;
    this.abilityCooldown = 4000;
    this.isCharging = false;
    this.chargeTarget = null;
    this.chargeSpeed = this.speed * 4;
    this.phase = 1; // Boss phases based on health
  }

  update(canvas, updateHUD, gameOver) {
    const now = Date.now();

    // Update phase
    const healthPercent = this.health / this.maxHealth;
    if (healthPercent < 0.33) this.phase = 3;
    else if (healthPercent < 0.66) this.phase = 2;

    // Charge attack ability
    if (!this.isCharging && now - this.lastAbility > this.abilityCooldown / this.phase) {
      this.isCharging = true;
      this.chargeTarget = { x: this.player.x, y: this.player.y };
      this.lastAbility = now;
      setTimeout(() => { this.isCharging = false; }, 600);
    }

    const dx = this.player.x - this.x;
    const dy = this.player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (this.isCharging && this.chargeTarget) {
      const cdx = this.chargeTarget.x - this.x;
      const cdy = this.chargeTarget.y - this.y;
      const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
      if (cdist > 5) {
        this.x += (cdx / cdist) * this.chargeSpeed;
        this.y += (cdy / cdist) * this.chargeSpeed;
      }
    } else if (dist > this.player.radius + this.radius) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }

    // Attack when close
    if (dist <= this.player.radius + this.radius && !this.player.isDashing) {
      if (now - this.lastAttack > this.attackRate) {
        const dmg = this.isCharging ? this.damage * 2 : this.damage;
        this.player.health -= dmg;
        this.lastAttack = now;
        soundManager.play('playerHurt');
        canvas.style.transform = `translate(${Math.random() * 6 - 3}px, ${Math.random() * 6 - 3}px)`;
        setTimeout(() => (canvas.style.transform = ''), 80);
        updateHUD();
        if (this.player.health <= 0) gameOver();
      }
    }

    // Keep in bounds
    this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
  }

  draw(ctx) {
    const dx = this.player.x - this.x;
    const facingLeft = dx < 0;

    drawBossVampire(ctx, this.x, this.y, this.size, facingLeft, this.health / this.maxHealth, Date.now());

    // Boss health bar (wider, more prominent)
    const barWidth = 80;
    const barHeight = 8;
    const barX = this.x - barWidth / 2;
    const barY = this.y - this.size / 2 - 25;

    // Background
    ctx.fillStyle = 'rgba(50, 0, 0, 0.9)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Health (color changes with phase)
    const healthPercent = this.health / this.maxHealth;
    ctx.fillStyle = healthPercent > 0.66 ? '#c41e3a' : healthPercent > 0.33 ? '#ff6600' : '#ff0000';
    ctx.fillRect(barX, barY, healthPercent * barWidth, barHeight);

    // Border
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Boss label
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⚔ BOSS ⚔', this.x, barY - 5);

    // Charge indicator
    if (this.isCharging) {
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  hit(damage) {
    this.health -= damage;
    return this.health <= 0;
  }
}
