// ═══════════════════════════════════════════════════════════════════════════
//  draw/mod.rs
//  Mirrors svgCharacters.js — procedural character rendering.
//
//  JS ctx.arc / ctx.fillRect → macroquad draw_circle / draw_rectangle
//  JS ctx.save/translate/rotate → manual matrix math or draw_poly
//
//  All coordinates use the same relative offsets as the JS version,
//  scaled by  s = size / 60.0  (same formula: const s = size / 60).
// ═══════════════════════════════════════════════════════════════════════════

use macroquad::prelude::*;
use crate::entities::{Enemy, EnemyKind};

// ── Helpers ───────────────────────────────────────────────────────────────────
/// Rotate a 2D point around the origin, then translate.
fn rotated(local: Vec2, angle: f32, origin: Vec2) -> Vec2 {
    let cos = angle.cos();
    let sin = angle.sin();
    origin + vec2(local.x * cos - local.y * sin, local.x * sin + local.y * cos)
}

/// Draw a filled circle at a rotated local position.
fn rc(local: Vec2, r: f32, color: Color, angle: f32, origin: Vec2) {
    let p = rotated(local, angle, origin);
    draw_circle(p.x, p.y, r, color);
}

/// Draw a filled rectangle at a rotated local position (approximate with circle for now).
fn rr(local: Vec2, w: f32, h: f32, color: Color, angle: f32, origin: Vec2) {
    // macroquad draw_rectangle doesn't support rotation natively;
    // we approximate with draw_rectangle and accept axis-aligned for body parts.
    let p = rotated(local, angle, origin);
    draw_rectangle(p.x - w / 2.0, p.y - h / 2.0, w, h, color);
}

// ── Aim line (mirrors ctx.setLineDash + moveTo/lineTo in draw()) ──────────────
pub fn draw_aim_line(from: Vec2, to: Vec2) {
    // Dashed line — draw short segments every 10px
    let dir    = (to - from).normalize();
    let total  = (to - from).length().min(300.0);
    let mut d  = 0.0;
    let seg    = 8.0;
    let gap    = 6.0;
    while d < total {
        let a = from + dir * d;
        let b = from + dir * (d + seg).min(total);
        draw_line(a.x, a.y, b.x, b.y, 1.0, Color { r: 1.0, g: 1.0, b: 1.0, a: 0.3 });
        d += seg + gap;
    }
}

// ── Player (mirrors drawPlayer in svgCharacters.js) ──────────────────────────
pub fn draw_player(pos: Vec2, size: f32, angle: f32, is_dashing: bool) {
    let s = size / 60.0;

    // Dash glow
    if is_dashing {
        draw_circle(pos.x, pos.y, 30.0 * s,
            Color { r: 0.0, g: 0.8, b: 1.0, a: 0.3 });
    }

    // Body armor — blue ellipse (approximated as circle)
    rc(vec2(0.0, 0.0), 18.0 * s, Color::from_hex(0x2a5c8a), angle, pos);

    // Chest plate
    rr(vec2(0.0, -2.0 * s), 20.0 * s, 20.0 * s, Color::from_hex(0x3a7cbf), angle, pos);

    // Energy core
    let core_color = if is_dashing {
        Color::from_hex(0x00ffff)
    } else {
        Color::from_hex(0x00cc88)
    };
    rc(vec2(0.0, -2.0 * s), 4.0 * s, core_color, angle, pos);

    // Helmet
    rc(vec2(0.0, -16.0 * s), 12.0 * s, Color::from_hex(0x334d66), angle, pos);

    // Visor
    rc(vec2(4.0 * s, -17.0 * s), 7.0 * s, Color::from_hex(0x00ddff), angle, pos);

    // Gun arm — rectangle pointing forward (+x in local space)
    let gun_start = rotated(vec2(12.0 * s, -2.0 * s), angle, pos);
    let gun_end   = rotated(vec2(36.0 * s, -2.0 * s), angle, pos);
    draw_line(gun_start.x, gun_start.y, gun_end.x, gun_end.y, 6.0 * s,
        Color::from_hex(0x445566));

    // Muzzle glow
    rc(vec2(36.0 * s, -2.0 * s), 2.0 * s, Color::from_hex(0xffaa00), angle, pos);

    // Legs
    rr(vec2(-6.5 * s, 22.0 * s), 7.0 * s, 12.0 * s, Color::from_hex(0x1e4060), angle, pos);
    rr(vec2( 6.5 * s, 22.0 * s), 7.0 * s, 12.0 * s, Color::from_hex(0x1e4060), angle, pos);
}

// ── Vampire enemy (mirrors drawVampire in svgCharacters.js) ──────────────────
pub fn draw_vampire_shape(pos: Vec2, size: f32, facing_left: bool, hp_pct: f32) {
    let s    = size / 60.0;
    let flip = if facing_left { -1.0 } else { 1.0 };

    // Helpers that respect facing direction
    let p = |lx: f32, ly: f32| pos + vec2(lx * s * flip, ly * s);

    // Cape (dark red)
    let cape = Color::from_hex(0x3d0a2e);
    draw_triangle(p(-12.0, -8.0), p(-28.0, 10.0), p(-5.0, 20.0),  cape);
    draw_triangle(p( 12.0, -8.0), p( 28.0, 10.0), p( 5.0, 20.0),  cape);

    // Cape lining
    let lining = Color::from_hex(0x6b0040);
    draw_triangle(p(-10.0, -6.0), p(-22.0, 8.0), p(-5.0, 18.0),  lining);
    draw_triangle(p( 10.0, -6.0), p( 22.0, 8.0), p( 5.0, 18.0),  lining);

    // Body
    draw_circle(pos.x, pos.y + 4.0 * s, 12.0 * s, Color::from_hex(0x2d2d2d));

    // Head — skin tone
    let skin = Color::from_hex(0xc4a882);
    draw_circle(pos.x, pos.y - 16.0 * s, 12.0 * s, skin);

    // Hair (upper half, dark)
    draw_circle(pos.x, pos.y - 18.0 * s, 12.0 * s, Color::from_hex(0x1a1a1a));

    // Red glowing eyes
    let red = Color::from_hex(0xff0000);
    draw_circle((pos + vec2(-5.0 * s * flip, -17.0 * s)).x, (pos + vec2(-5.0 * s * flip, -17.0 * s)).y, 3.0 * s, red);
    draw_circle((pos + vec2( 5.0 * s * flip, -17.0 * s)).x, (pos + vec2( 5.0 * s * flip, -17.0 * s)).y, 3.0 * s, red);

    // Fangs
    let white = WHITE;
    draw_triangle(
        p(-3.0, -10.0), p(-2.0, -5.0), p(-1.0, -10.0), white,
    );
    draw_triangle(
        p( 1.0, -10.0), p( 2.0, -5.0), p( 3.0, -10.0), white,
    );

    // Hands
    draw_circle(p(-14.0, 8.0).x, p(-14.0, 8.0).y, 4.0 * s, skin);
    draw_circle(p( 14.0, 8.0).x, p( 14.0, 8.0).y, 4.0 * s, skin);
}

fn draw_boss_aura(pos: Vec2, size: f32, elapsed: f32) {
    let pulse = (elapsed * 2.0).sin() * 0.15 + 0.3;
    let r     = size * 0.8;
    // Pulsing dark-red aura (approximated as concentric circles)
    draw_circle(pos.x, pos.y, r,
        Color { r: 0.4, g: 0.0, b: 0.12, a: pulse * 0.5 });
    draw_circle(pos.x, pos.y, r * 0.6,
        Color { r: 0.6, g: 0.0, b: 0.0, a: pulse * 0.3 });

    // Orbiting particles
    for i in 0..6 {
        let a = elapsed * 0.002 * 60.0 + (i as f32 * std::f32::consts::TAU / 6.0);
        let dist = size * 0.5;
        let px = pos.x + a.cos() * dist;
        let py = pos.y + a.sin() * dist;
        draw_circle(px, py, 3.0, Color { r: 1.0, g: 0.0, b: 0.0, a: pulse });
    }
}

/// Top-level enemy draw dispatcher.
pub fn draw_enemy(enemy: &Enemy) {
    let hp_pct = enemy.health / enemy.max_health;

    match &enemy.kind {
        EnemyKind::Regular => {
            draw_vampire_shape(enemy.pos, enemy.size, enemy.facing_left, hp_pct);
            draw_health_bar(enemy.pos, 50.0, 6.0, hp_pct, enemy.size, false);
        }
        EnemyKind::Boss { is_charging, .. } => {
            // Aura uses get_time() from macroquad
            draw_boss_aura(enemy.pos, enemy.size, get_time() as f32);
            draw_vampire_shape(enemy.pos, enemy.size, enemy.facing_left, hp_pct);

            // Horns
            let s = enemy.size / 60.0;
            let dark = Color::from_hex(0x1a1a1a);
            draw_triangle(
                vec2(enemy.pos.x - 10.0 * s, enemy.pos.y - 26.0 * s),
                vec2(enemy.pos.x - 14.0 * s, enemy.pos.y - 38.0 * s),
                vec2(enemy.pos.x -  6.0 * s, enemy.pos.y - 28.0 * s),
                dark,
            );
            draw_triangle(
                vec2(enemy.pos.x + 10.0 * s, enemy.pos.y - 26.0 * s),
                vec2(enemy.pos.x + 14.0 * s, enemy.pos.y - 38.0 * s),
                vec2(enemy.pos.x +  6.0 * s, enemy.pos.y - 28.0 * s),
                dark,
            );

            // Charge ring
            if *is_charging {
                draw_circle_lines(
                    enemy.pos.x, enemy.pos.y,
                    enemy.radius + 10.0, 3.0,
                    Color { r: 1.0, g: 0.0, b: 0.0, a: 0.6 },
                );
            }

            // Boss health bar (wider)
            draw_text("⚔ BOSS ⚔",
                enemy.pos.x - 35.0, enemy.pos.y - enemy.size / 2.0 - 30.0,
                14.0, YELLOW);
            draw_health_bar(enemy.pos, 80.0, 8.0, hp_pct, enemy.size, true);
        }
    }
}

fn draw_health_bar(pos: Vec2, bar_w: f32, bar_h: f32, hp_pct: f32, size: f32, is_boss: bool) {
    if !is_boss && hp_pct >= 1.0 { return; } // hide full-health regular bars

    let bx = pos.x - bar_w / 2.0;
    let by = pos.y - size / 2.0 - (if is_boss { 22.0 } else { 12.0 });

    draw_rectangle(bx, by, bar_w, bar_h, Color::from_hex(0x320000));
    let fill_color = if hp_pct > 0.66 {
        Color::from_hex(0xc41e3a)
    } else if hp_pct > 0.33 {
        Color::from_hex(0xff6600)
    } else {
        RED
    };
    draw_rectangle(bx, by, bar_w * hp_pct, bar_h, fill_color);
    draw_rectangle_lines(bx, by, bar_w, bar_h, 1.0,
        if is_boss { YELLOW } else { BLACK });
}