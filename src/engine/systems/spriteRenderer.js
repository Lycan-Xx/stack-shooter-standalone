import { drawPlayer, drawVampire, drawBossVampire } from './svgCharacters.js';

// Rendering-only animation state. The simulation remains authoritative; this
// module turns its flat render data into readable visual states.
export function createSpriteRenderer() {
  const state = new Map();
  return {
    drawPlayer(ctx, data) {
      const bob = data.moving ? Math.sin(data.time * 0.012) * data.size * 0.035 : 0;
      drawPlayer(ctx, data.x, data.y + bob, data.size * (data.dashing ? 1.08 : 1), data.angle, data.dashing);
      if (data.dashing) drawDashStreak(ctx, data.x, data.y, data.size, data.angle);
    },
    drawEnemy(ctx, data) {
      const key = data.id ?? `${data.x}:${data.y}`;
      const previous = state.get(key) || { hp: data.hp, hurtUntil: 0 };
      if (data.hp < previous.hp) previous.hurtUntil = data.time + 110;
      previous.hp = data.hp; state.set(key, previous);
      const hurt = previous.hurtUntil > data.time;
      ctx.save();
      if (hurt) ctx.globalCompositeOperation = 'lighter';
      const bob = data.moving ? Math.sin(data.time * 0.01 + data.x) * data.size * 0.025 : 0;
      if (data.boss) drawBossVampire(ctx, data.x, data.y + bob, data.size, data.facingLeft, data.hp / data.maxHp, data.time);
      else drawVampire(ctx, data.x, data.y + bob, data.size, data.facingLeft, data.hp / data.maxHp);
      if (hurt) { ctx.fillStyle = 'rgba(255,245,235,.35)'; ctx.beginPath(); ctx.arc(data.x, data.y, data.size * .42, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    },
  };
}

function drawDashStreak(ctx, x, y, size, angle) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.globalAlpha = .35;
  const gradient = ctx.createLinearGradient(-size * 1.8, 0, 0, 0);
  gradient.addColorStop(0, 'transparent'); gradient.addColorStop(1, '#67c8ff'); ctx.fillStyle = gradient;
  ctx.beginPath(); ctx.moveTo(-size * 1.8, 0); ctx.lineTo(-size * .2, -size * .28); ctx.lineTo(-size * .2, size * .28); ctx.closePath(); ctx.fill(); ctx.restore();
}
