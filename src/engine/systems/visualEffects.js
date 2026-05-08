/**
 * Visual effects for combat feedback
 */

export class HitMarker {
  constructor(x, y, isKill = false) {
    this.x = x;
    this.y = y;
    this.isKill = isKill;
    this.life = 300; // 300ms duration
    this.maxLife = 300;
    this.size = isKill ? 40 : 30;
  }

  update() {
    this.life -= 16; // ~60fps
    return this.life > 0;
  }

  draw(ctx) {
    const alpha = this.life / this.maxLife;
    const currentSize = this.size * (1 + (1 - alpha) * 0.5); // Grows slightly

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = this.isKill ? '#ff0000' : '#ffffff';
    ctx.lineWidth = this.isKill ? 4 : 3;
    ctx.lineCap = 'round';

    const halfSize = currentSize / 2;

    // Draw X shape
    ctx.beginPath();
    ctx.moveTo(this.x - halfSize, this.y - halfSize);
    ctx.lineTo(this.x + halfSize, this.y + halfSize);
    ctx.moveTo(this.x + halfSize, this.y - halfSize);
    ctx.lineTo(this.x - halfSize, this.y + halfSize);
    ctx.stroke();

    // Draw circle for kills
    if (this.isKill) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

export class DamageNumber {
  constructor(x, y, damage, isKill = false, isCrit = false) {
    this.x = x;
    this.y = y;
    this.damage = Math.floor(damage);
    this.isKill = isKill;
    this.isCrit = isCrit;
    this.life = 1000; // 1 second
    this.maxLife = 1000;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = -2; // Float upward
  }

  update() {
    this.life -= 16;
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1; // Slight gravity
    return this.life > 0;
  }

  draw(ctx) {
    const alpha = Math.min(1, this.life / this.maxLife);
    const scale = 1 + (1 - alpha) * 0.3;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${this.isCrit ? 32 : 24}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Shadow for readability
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';

    // Color based on type
    if (this.isKill) {
      ctx.fillStyle = '#ff0000';
      ctx.fillText(`KILL +${this.damage}`, this.x, this.y);
    } else if (this.isCrit) {
      ctx.fillStyle = '#ffaa00';
      ctx.fillText(`${this.damage}!`, this.x, this.y);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillText(this.damage.toString(), this.x, this.y);
    }

    ctx.restore();
  }
}

export class HitEffect {
  constructor(x, y, color = '#ff0000') {
    this.x = x;
    this.y = y;
    this.color = color;
    this.life = 200;
    this.maxLife = 200;
    this.particles = [];

    // Create particles
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      this.particles.push({
        x: 0,
        y: 0,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
      });
    }
  }

  update() {
    this.life -= 16;

    this.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
    });

    return this.life > 0;
  }

  draw(ctx) {
    const alpha = this.life / this.maxLife;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;

    this.particles.forEach((p) => {
      ctx.beginPath();
      ctx.arc(this.x + p.x, this.y + p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }
}

export class KillFeed {
  constructor() {
    this.kills = [];
    this.maxKills = 5;
  }

  addKill(killer, victim) {
    this.kills.unshift({
      killer,
      victim,
      time: Date.now(),
    });

    if (this.kills.length > this.maxKills) {
      this.kills.pop();
    }
  }

  draw(ctx, canvas) {
    const now = Date.now();
    const x = canvas.width - 250;
    let y = 100;

    ctx.save();
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'right';

    this.kills = this.kills.filter((kill) => now - kill.time < 5000); // 5 seconds

    this.kills.forEach((kill) => {
      const age = now - kill.time;
      const alpha = Math.max(0, 1 - age / 5000);

      ctx.globalAlpha = alpha;

      // Killer name
      ctx.fillStyle = '#4caf50';
      ctx.fillText(kill.killer, x - 60, y);

      // Skull icon
      ctx.fillStyle = '#ffffff';
      ctx.fillText('💀', x - 30, y);

      // Victim name
      ctx.fillStyle = '#f44336';
      ctx.fillText(kill.victim, x, y);

      y += 25;
    });

    ctx.restore();
  }
}
