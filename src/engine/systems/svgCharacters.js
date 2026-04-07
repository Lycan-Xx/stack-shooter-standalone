/**
 * Hand-drawn canvas characters for player and vampire
 * Replaces external image dependencies for better performance and custom design
 */

/**
 * Draw the player character - a futuristic armored shooter
 */
export function drawPlayer(ctx, x, y, size, angle, isDashing) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const s = size / 60; // scale factor

  // Dash glow effect
  if (isDashing) {
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ccff';
  }

  // Body armor (torso)
  ctx.fillStyle = '#2a5c8a';
  ctx.beginPath();
  ctx.ellipse(0, 0, 18 * s, 22 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1a3d5c';
  ctx.lineWidth = 2 * s;
  ctx.stroke();

  // Chest plate detail
  ctx.fillStyle = '#3a7cbf';
  ctx.beginPath();
  ctx.moveTo(-10 * s, -12 * s);
  ctx.lineTo(10 * s, -12 * s);
  ctx.lineTo(8 * s, 8 * s);
  ctx.lineTo(-8 * s, 8 * s);
  ctx.closePath();
  ctx.fill();

  // Energy core on chest
  ctx.fillStyle = isDashing ? '#00ffff' : '#00cc88';
  ctx.shadowBlur = isDashing ? 15 : 8;
  ctx.shadowColor = isDashing ? '#00ffff' : '#00cc88';
  ctx.beginPath();
  ctx.arc(0, -2 * s, 4 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Helmet / head
  ctx.fillStyle = '#334d66';
  ctx.beginPath();
  ctx.arc(0, -16 * s, 12 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1a3d5c';
  ctx.lineWidth = 1.5 * s;
  ctx.stroke();

  // Visor
  ctx.fillStyle = '#00ddff';
  ctx.shadowBlur = 6;
  ctx.shadowColor = '#00ddff';
  ctx.beginPath();
  ctx.ellipse(4 * s, -17 * s, 8 * s, 4 * s, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Visor reflection
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.ellipse(6 * s, -19 * s, 3 * s, 1.5 * s, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Gun arm (pointing forward)
  ctx.fillStyle = '#445566';
  ctx.fillRect(12 * s, -5 * s, 20 * s, 6 * s);
  // Gun barrel
  ctx.fillStyle = '#333';
  ctx.fillRect(28 * s, -4 * s, 8 * s, 4 * s);
  // Muzzle glow
  ctx.fillStyle = '#ffaa00';
  ctx.shadowBlur = 5;
  ctx.shadowColor = '#ffaa00';
  ctx.beginPath();
  ctx.arc(36 * s, -2 * s, 2 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Shoulder pads
  ctx.fillStyle = '#2a5c8a';
  ctx.beginPath();
  ctx.ellipse(-14 * s, -8 * s, 8 * s, 6 * s, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1a3d5c';
  ctx.lineWidth = 1.5 * s;
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(14 * s, -8 * s, 8 * s, 6 * s, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Legs (two small shapes below)
  ctx.fillStyle = '#1e4060';
  ctx.fillRect(-10 * s, 16 * s, 7 * s, 12 * s);
  ctx.fillRect(3 * s, 16 * s, 7 * s, 12 * s);

  // Boot accents
  ctx.fillStyle = '#00cc88';
  ctx.fillRect(-10 * s, 24 * s, 7 * s, 3 * s);
  ctx.fillRect(3 * s, 24 * s, 7 * s, 3 * s);

  ctx.restore();
}

/**
 * Draw the vampire enemy - a menacing vampire with cape and fangs
 */
export function drawVampire(ctx, x, y, size, facingLeft, healthPercent) {
  ctx.save();
  ctx.translate(x, y);
  if (facingLeft) ctx.scale(-1, 1);

  const s = size / 60;

  // Cape (background layer)
  ctx.fillStyle = '#3d0a2e';
  ctx.beginPath();
  ctx.moveTo(-12 * s, -8 * s);
  ctx.quadraticCurveTo(-28 * s, 10 * s, -20 * s, 28 * s);
  ctx.lineTo(-5 * s, 20 * s);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(12 * s, -8 * s);
  ctx.quadraticCurveTo(28 * s, 10 * s, 20 * s, 28 * s);
  ctx.lineTo(5 * s, 20 * s);
  ctx.closePath();
  ctx.fill();

  // Cape inner lining
  ctx.fillStyle = '#6b0040';
  ctx.beginPath();
  ctx.moveTo(-10 * s, -6 * s);
  ctx.quadraticCurveTo(-22 * s, 8 * s, -16 * s, 24 * s);
  ctx.lineTo(-5 * s, 18 * s);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(10 * s, -6 * s);
  ctx.quadraticCurveTo(22 * s, 8 * s, 16 * s, 24 * s);
  ctx.lineTo(5 * s, 18 * s);
  ctx.closePath();
  ctx.fill();

  // Body
  ctx.fillStyle = '#2d2d2d';
  ctx.beginPath();
  ctx.ellipse(0, 4 * s, 12 * s, 16 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Collar/vest
  ctx.fillStyle = '#4a0030';
  ctx.beginPath();
  ctx.moveTo(-8 * s, -8 * s);
  ctx.lineTo(0, -2 * s);
  ctx.lineTo(8 * s, -8 * s);
  ctx.lineTo(6 * s, 4 * s);
  ctx.lineTo(-6 * s, 4 * s);
  ctx.closePath();
  ctx.fill();

  // Head
  ctx.fillStyle = '#c4a882';
  ctx.beginPath();
  ctx.arc(0, -16 * s, 12 * s, 0, Math.PI * 2);
  ctx.fill();

  // Hair (slicked back)
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(0, -18 * s, 12 * s, Math.PI, Math.PI * 2);
  ctx.fill();
  // Widow's peak
  ctx.beginPath();
  ctx.moveTo(-6 * s, -22 * s);
  ctx.lineTo(0, -14 * s);
  ctx.lineTo(6 * s, -22 * s);
  ctx.closePath();
  ctx.fill();

  // Eyes - glowing red
  ctx.fillStyle = '#ff0000';
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#ff0000';
  ctx.beginPath();
  ctx.ellipse(-5 * s, -17 * s, 3 * s, 2.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(5 * s, -17 * s, 3 * s, 2.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Pupils
  ctx.fillStyle = '#330000';
  ctx.beginPath();
  ctx.arc(-5 * s, -17 * s, 1.2 * s, 0, Math.PI * 2);
  ctx.arc(5 * s, -17 * s, 1.2 * s, 0, Math.PI * 2);
  ctx.fill();

  // Mouth with fangs
  ctx.fillStyle = '#3d0000';
  ctx.beginPath();
  ctx.ellipse(0, -10 * s, 5 * s, 3 * s, 0, 0, Math.PI);
  ctx.fill();

  // Fangs
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-3 * s, -10 * s);
  ctx.lineTo(-2 * s, -5 * s);
  ctx.lineTo(-1 * s, -10 * s);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(1 * s, -10 * s);
  ctx.lineTo(2 * s, -5 * s);
  ctx.lineTo(3 * s, -10 * s);
  ctx.fill();

  // Clawed hands
  ctx.fillStyle = '#c4a882';
  // Left hand
  ctx.beginPath();
  ctx.arc(-14 * s, 8 * s, 4 * s, 0, Math.PI * 2);
  ctx.fill();
  // Claws
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1.5 * s;
  for (let i = 0; i < 3; i++) {
    const angle = -0.5 + i * 0.4;
    ctx.beginPath();
    ctx.moveTo(-14 * s + Math.cos(angle) * 4 * s, 8 * s + Math.sin(angle) * 4 * s);
    ctx.lineTo(-14 * s + Math.cos(angle) * 8 * s, 8 * s + Math.sin(angle) * 8 * s);
    ctx.stroke();
  }
  // Right hand
  ctx.fillStyle = '#c4a882';
  ctx.beginPath();
  ctx.arc(14 * s, 8 * s, 4 * s, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    const angle = Math.PI - 0.5 + i * 0.4;
    ctx.beginPath();
    ctx.moveTo(14 * s + Math.cos(angle) * 4 * s, 8 * s + Math.sin(angle) * 4 * s);
    ctx.lineTo(14 * s + Math.cos(angle) * 8 * s, 8 * s + Math.sin(angle) * 8 * s);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw a boss vampire - larger, more intimidating with aura
 */
export function drawBossVampire(ctx, x, y, size, facingLeft, healthPercent, time) {
  ctx.save();
  ctx.translate(x, y);

  // Pulsing dark aura
  const pulse = Math.sin(time * 0.005) * 0.3 + 0.7;
  const auraRadius = size * 0.8;
  const gradient = ctx.createRadialGradient(0, 0, size * 0.3, 0, 0, auraRadius);
  gradient.addColorStop(0, `rgba(100, 0, 0, ${0.3 * pulse})`);
  gradient.addColorStop(0.5, `rgba(60, 0, 30, ${0.15 * pulse})`);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
  ctx.fill();

  // Floating particles around boss
  for (let i = 0; i < 6; i++) {
    const angle = (time * 0.002) + (i * Math.PI * 2 / 6);
    const dist = size * 0.5 + Math.sin(time * 0.003 + i) * 10;
    const px = Math.cos(angle) * dist;
    const py = Math.sin(angle) * dist;
    ctx.fillStyle = `rgba(255, 0, 0, ${0.5 * pulse})`;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // Draw base vampire at larger scale
  drawVampire(ctx, x, y, size, facingLeft, healthPercent);

  // Crown / horns on top
  ctx.save();
  ctx.translate(x, y);
  if (facingLeft) ctx.scale(-1, 1);
  const s = size / 60;

  // Horns
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.moveTo(-10 * s, -26 * s);
  ctx.lineTo(-14 * s, -38 * s);
  ctx.lineTo(-6 * s, -28 * s);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(10 * s, -26 * s);
  ctx.lineTo(14 * s, -38 * s);
  ctx.lineTo(6 * s, -28 * s);
  ctx.closePath();
  ctx.fill();

  // Horn tips glow
  ctx.fillStyle = '#ff0000';
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#ff0000';
  ctx.beginPath();
  ctx.arc(-14 * s, -38 * s, 2 * s, 0, Math.PI * 2);
  ctx.arc(14 * s, -38 * s, 2 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.restore();
}

/**
 * Ricochet spark effect when bullet hits enemy
 */
export class RicochetEffect {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.life = 250;
    this.maxLife = 250;
    this.sparks = [];

    // Create sparks radiating from impact point
    const sparkCount = 6 + Math.floor(Math.random() * 4);
    for (let i = 0; i < sparkCount; i++) {
      const sparkAngle = angle + (Math.random() - 0.5) * Math.PI;
      const speed = 3 + Math.random() * 5;
      this.sparks.push({
        x: 0,
        y: 0,
        vx: Math.cos(sparkAngle) * speed,
        vy: Math.sin(sparkAngle) * speed,
        size: 1 + Math.random() * 2,
        color: Math.random() > 0.5 ? '#ffdd00' : '#ff8800',
      });
    }
  }

  update() {
    this.life -= 16;
    for (const spark of this.sparks) {
      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.vx *= 0.92;
      spark.vy *= 0.92;
      spark.vy += 0.15; // gravity
    }
    return this.life > 0;
  }

  draw(ctx) {
    const alpha = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;

    // Impact flash
    if (this.life > this.maxLife * 0.7) {
      const flashAlpha = (this.life - this.maxLife * 0.7) / (this.maxLife * 0.3);
      ctx.fillStyle = `rgba(255, 255, 200, ${flashAlpha * 0.6})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sparks
    for (const spark of this.sparks) {
      ctx.fillStyle = spark.color;
      ctx.shadowBlur = 4;
      ctx.shadowColor = spark.color;
      ctx.beginPath();
      ctx.arc(this.x + spark.x, this.y + spark.y, spark.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}
