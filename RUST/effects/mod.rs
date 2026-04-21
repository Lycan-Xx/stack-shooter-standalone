// ═══════════════════════════════════════════════════════════════════════════
//  effects/mod.rs  —  mirrors visualEffects.js + RicochetEffect from svgCharacters.js
// ═══════════════════════════════════════════════════════════════════════════

use macroquad::prelude::*;

// ── HitMarker ────────────────────────────────────────────────────────────────
pub struct HitMarker {
    pos:     Vec2,
    is_kill: bool,
    life:    f32,
    max:     f32,
    size:    f32,
}
impl HitMarker {
    pub fn new(pos: Vec2, is_kill: bool) -> Self {
        Self { pos, is_kill, life: 0.3, max: 0.3, size: if is_kill { 40.0 } else { 30.0 } }
    }
    pub fn update(&mut self, dt: f32) -> bool { self.life -= dt; self.life > 0.0 }
    pub fn draw(&self) {
        let alpha  = self.life / self.max;
        let cur    = self.size * (1.0 + (1.0 - alpha) * 0.5);
        let half   = cur / 2.0;
        let color  = Color { a: alpha, ..if self.is_kill { RED } else { WHITE } };
        draw_line(self.pos.x - half, self.pos.y - half, self.pos.x + half, self.pos.y + half, 3.0, color);
        draw_line(self.pos.x + half, self.pos.y - half, self.pos.x - half, self.pos.y + half, 3.0, color);
        if self.is_kill {
            draw_circle_lines(self.pos.x, self.pos.y, cur, 3.0, color);
        }
    }
}

// ── DamageNumber ─────────────────────────────────────────────────────────────
pub struct DamageNumber {
    pos:     Vec2,
    vel:     Vec2,
    damage:  u32,
    is_kill: bool,
    is_crit: bool,
    life:    f32,
    max:     f32,
}
impl DamageNumber {
    pub fn new(pos: Vec2, damage: u32, is_kill: bool, is_crit: bool) -> Self {
        Self {
            pos,
            vel:     vec2(rand::gen_range(-1.0, 1.0), -2.0),
            damage,
            is_kill,
            is_crit,
            life:    1.0,
            max:     1.0,
        }
    }
    pub fn update(&mut self, dt: f32) -> bool {
        self.pos += self.vel;
        self.vel.y += 0.1;
        self.life  -= dt;
        self.life > 0.0
    }
    pub fn draw(&self) {
        let alpha  = (self.life / self.max).min(1.0);
        let color  = if self.is_kill   { Color { a: alpha, ..RED }
                     } else if self.is_crit { Color { r: 1.0, g: 0.67, b: 0.0, a: alpha }
                     } else { Color { r: 1.0, g: 1.0, b: 1.0, a: alpha } };
        let text   = if self.is_kill { format!("KILL +{}", self.damage) }
                     else { self.damage.to_string() };
        let size   = if self.is_crit { 32.0 } else { 24.0 };
        draw_text(&text, self.pos.x - 20.0, self.pos.y, size, color);
    }
}

// ── RicochetEffect (mirrors RicochetEffect class in svgCharacters.js) ─────────
struct Spark { pos: Vec2, vel: Vec2, size: f32, color: Color }

pub struct RicochetEffect {
    origin: Vec2,
    life:   f32,
    max:    f32,
    sparks: Vec<Spark>,
}
impl RicochetEffect {
    pub fn new(pos: Vec2, angle: f32) -> Self {
        let count = rand::gen_range(6, 10);
        let sparks = (0..count).map(|_| {
            let a   = angle + rand::gen_range(-std::f32::consts::FRAC_PI_2, std::f32::consts::FRAC_PI_2);
            let spd = rand::gen_range(3.0, 8.0);
            let col = if rand::gen_range(0.0, 1.0) > 0.5 { Color::from_hex(0xffdd00) }
                      else { Color::from_hex(0xff8800) };
            Spark { pos: Vec2::ZERO, vel: vec2(a.cos() * spd, a.sin() * spd), size: rand::gen_range(1.0, 3.0), color: col }
        }).collect();
        Self { origin: pos, life: 0.25, max: 0.25, sparks }
    }
    pub fn update(&mut self, dt: f32) -> bool {
        self.life -= dt;
        for s in &mut self.sparks {
            s.pos += s.vel;
            s.vel *= 0.92;
            s.vel.y += 0.15;
        }
        self.life > 0.0
    }
    pub fn draw(&self) {
        let alpha = self.life / self.max;
        for s in &self.sparks {
            let c = Color { a: alpha * s.size / 3.0, ..s.color };
            draw_circle(self.origin.x + s.pos.x, self.origin.y + s.pos.y, s.size * alpha, c);
        }
    }
}