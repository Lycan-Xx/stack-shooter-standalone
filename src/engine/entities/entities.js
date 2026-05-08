import { DIFFICULTY } from '../logic/difficulty.js';
import { soundManager } from '../systems/sound.js';
import { drawVampire } from '../systems/svgCharacters.js';

export class Vampire {
  constructor(x, y, wave, difficulty, images, player, challengeData = null) {
    this.x = x;
    this.y = y;
    this.radius = 30;
    this.size = 60;
    this.player = player;

    const diff = difficulty === 'challenge' ? DIFFICULTY.normal : DIFFICULTY[difficulty];
    
    // Apply challenge modifiers if in challenge mode
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
    
    this.health = (diff.enemyHealth + Math.floor((wave - 1) * 5)) * healthMult;
    this.maxHealth = this.health;
    this.speed = (diff.enemySpeed + Math.min((wave - 1) * 0.03, 0.5)) * speedMult;
    this.damage = diff.enemyDamage;
    this.color = '#8b0000';
    this.lastAttack = 0;
    this.attackRate = 1000;
    this.scoreValue = 10 * scoreMult;
  }

  update(canvas, updateHUD, gameOver) {
    const dx = this.player.x - this.x;
    const dy = this.player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > this.player.radius + this.radius) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    } else if (!this.player.isDashing) {
      const now = Date.now();
      if (now - this.lastAttack > this.attackRate) {
        this.player.health -= this.damage;
        this.lastAttack = now;

        soundManager.play('playerHurt');

        canvas.style.transform = `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`;
        setTimeout(() => (canvas.style.transform = ''), 50);

        updateHUD();

        if (this.player.health <= 0) {
          gameOver();
        }
      }
    }
  }

  draw(ctx) {
    const dx = this.player.x - this.x;
    const facingLeft = dx < 0;
    drawVampire(ctx, this.x, this.y, this.size, facingLeft, this.health / this.maxHealth);

    if (this.health < this.maxHealth) {
      const barWidth = 50;
      const barHeight = 6;
      const barX = this.x - barWidth / 2;
      const barY = this.y - this.size / 2 - 15;

      ctx.fillStyle = 'rgba(50, 0, 0, 0.8)';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      ctx.fillStyle = '#c41e3a';
      const healthWidth = (this.health / this.maxHealth) * barWidth;
      ctx.fillRect(barX, barY, healthWidth, barHeight);

      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
  }

  hit(damage) {
    this.health -= damage;
    return this.health <= 0;
  }
}

export class Bullet {
  constructor(x, y, angle, difficulty, piercing = 0) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = 15;
    this.radius = 4;
    this.damage = DIFFICULTY[difficulty].playerDamage;
    this.lifetime = 100;
    this.trail = [];
    this.piercing = piercing;
  }

  update(canvas) {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 5) this.trail.shift();

    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
    this.lifetime--;

    return (
      this.lifetime > 0 &&
      this.x > 0 &&
      this.x < canvas.width &&
      this.y > 0 &&
      this.y < canvas.height
    );
  }

  draw(ctx) {
    for (let i = 0; i < this.trail.length; i++) {
      const alpha = ((i + 1) / this.trail.length) * 0.5;
      ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
      ctx.beginPath();
      ctx.arc(this.trail[i].x, this.trail[i].y, this.radius * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#ffff00';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffff00';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

export class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 8;
    this.vy = (Math.random() - 0.5) * 8;
    this.radius = Math.random() * 3 + 1;
    this.color = color;
    this.alpha = 1;
    this.decay = 0.02;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2;
    this.alpha -= this.decay;
    return this.alpha > 0;
  }

  draw(ctx) {
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

export class BloodSplatter {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = Math.random() * 15 + 10;
    this.alpha = 0.6;
    this.decay = 0.005;
  }

  update() {
    this.alpha -= this.decay;
    return this.alpha > 0;
  }

  draw(ctx) {
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = '#8b0000';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * this.radius;
      const sx = this.x + Math.cos(angle) * dist;
      const sy = this.y + Math.sin(angle) * dist;
      const sr = Math.random() * 5 + 2;

      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

export class FloatingText {
  constructor(x, y, text, color) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.alpha = 1;
    this.vy = -2;
  }

  update() {
    this.y += this.vy;
    this.alpha -= 0.02;
    return this.alpha > 0;
  }

  draw(ctx) {
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(this.text, this.x, this.y);
    ctx.fillText(this.text, this.x, this.y);
    ctx.globalAlpha = 1;
  }
}
