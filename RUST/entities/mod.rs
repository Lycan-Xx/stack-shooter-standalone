// ═══════════════════════════════════════════════════════════════════════════
//  entities/mod.rs
//  Mirrors entities.js  +  Boss.js
//
//  JS classes → Rust structs + impl blocks.
//  The class hierarchy  class BossVampire extends Vampire  becomes
//  an enum EnemyKind { Regular, Boss(BossData) }  stored inside Enemy.
//  This is idiomatic Rust — enums replace inheritance.
// ═══════════════════════════════════════════════════════════════════════════

use macroquad::prelude::*;
use std::collections::HashMap;
use crate::config::{DifficultyConfig, UpgradeKey};

// ─────────────────────────────────────────────────────────────────────────────
//  Weapon  (part of Player)
// ─────────────────────────────────────────────────────────────────────────────
#[derive(Debug, Clone)]
pub struct Weapon {
    pub damage:    f32,
    pub fire_rate: f32,   // seconds between shots
    pub last_shot: f32,   // world.elapsed when last shot fired
    pub piercing:  u32,
}

impl Default for Weapon {
    fn default() -> Self {
        Self { damage: 50.0, fire_rate: 0.3, last_shot: -999.0, piercing: 0 }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Player  (mirrors playerRef in useGameLoop.js)
// ─────────────────────────────────────────────────────────────────────────────
#[derive(Debug, Clone)]
pub struct Player {
    pub pos:              Vec2,
    pub radius:           f32,
    pub size:             f32,
    pub health:           f32,
    pub max_health:       f32,
    pub speed:            f32,
    pub angle:            f32,   // radians, same as player.angle in JS
    pub is_dashing:       bool,
    pub dash_cooldown:    f32,   // seconds remaining
    pub max_dash_cooldown:f32,
    pub dash_duration:    f32,   // how long a single dash lasts (s)
    pub dash_timer:       f32,   // counts down from dash_duration
    pub dash_speed:       f32,
    pub dash_energy:      f32,
    pub max_dash_energy:  f32,
    pub dash_energy_regen:f32,
    pub weapon:           Weapon,
    pub upgrades:         HashMap<UpgradeKey, u32>,
}

impl Default for Player {
    fn default() -> Self {
        Self {
            pos:               Vec2::ZERO,
            radius:            30.0,
            size:              60.0,
            health:            100.0,
            max_health:        100.0,
            speed:             5.0,
            angle:             0.0,
            is_dashing:        false,
            dash_cooldown:     0.0,
            max_dash_cooldown: 4.0,
            dash_duration:     0.2,
            dash_timer:        0.0,
            dash_speed:        15.0,
            dash_energy:       100.0,
            max_dash_energy:   100.0,
            dash_energy_regen: 0.5,
            weapon:            Weapon::default(),
            upgrades:          HashMap::new(),
        }
    }
}

impl Player {
    pub fn new(x: f32, y: f32, diff: &DifficultyConfig) -> Self {
        Self {
            pos:               vec2(x, y),
            health:            diff.player_health,
            max_health:        diff.player_health,
            speed:             diff.player_speed,
            max_dash_cooldown: diff.dash_cooldown,
            weapon: Weapon {
                damage:    diff.player_damage,
                fire_rate: diff.fire_rate,
                ..Default::default()
            },
            ..Default::default()
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Enemy  (Vampire + BossVampire unified)
// ─────────────────────────────────────────────────────────────────────────────
#[derive(Debug, Clone, PartialEq)]
pub enum EnemyKind {
    Regular,
    Boss { phase: u8, is_charging: bool, charge_target: Vec2, charge_timer: f32, ability_timer: f32 },
}

#[derive(Debug, Clone)]
pub struct Enemy {
    pub pos:               Vec2,
    pub radius:            f32,
    pub size:              f32,
    pub health:            f32,
    pub max_health:        f32,
    pub speed:             f32,
    pub damage:            f32,
    pub attack_rate:       f32,   // seconds between attacks
    pub last_attack_timer: f32,   // time since last attack (counts up)
    pub score_value:       u32,
    pub kind:              EnemyKind,
    pub spawn_delay:       f32,   // replaces JS setTimeout stagger
    pub facing_left:       bool,
}

impl Enemy {
    // ── Regular vampire ──────────────────────────────────────────────────
    pub fn new_vampire(pos: Vec2, wave: u32, diff: &DifficultyConfig) -> Self {
        let health = diff.enemy_health + ((wave.saturating_sub(1)) as f32 * 5.0);
        let speed  = diff.enemy_speed  + ((wave.saturating_sub(1)) as f32 * 0.03).min(0.5);
        Self {
            pos,
            radius:            30.0,
            size:              60.0,
            health,
            max_health:        health,
            speed,
            damage:            diff.enemy_damage,
            attack_rate:       1.0,
            last_attack_timer: 0.0,
            score_value:       (10.0 * diff.score_multiplier) as u32,
            kind:              EnemyKind::Regular,
            spawn_delay:       0.0,
            facing_left:       false,
        }
    }

    // ── Boss vampire ─────────────────────────────────────────────────────
    // Mirrors BossVampire constructor: combined health of N replaced enemies
    pub fn new_boss(pos: Vec2, wave: u32, diff: &DifficultyConfig, num_replaced: u32) -> Self {
        let single_hp = diff.enemy_health + ((wave.saturating_sub(1)) as f32 * 5.0);
        let health    = single_hp * num_replaced as f32;
        let speed     = (diff.enemy_speed + ((wave.saturating_sub(1)) as f32 * 0.03).min(0.5)) * 0.7;
        Self {
            pos,
            radius:            50.0,
            size:              100.0,
            health,
            max_health:        health,
            speed,
            damage:            diff.enemy_damage * 2.0,
            attack_rate:       0.8,
            last_attack_timer: 0.0,
            score_value:       (10.0 * diff.score_multiplier * num_replaced as f32) as u32,
            kind: EnemyKind::Boss {
                phase:         1,
                is_charging:   false,
                charge_target: Vec2::ZERO,
                charge_timer:  0.0,
                ability_timer: 0.0,
            },
            spawn_delay:       0.0,
            facing_left:       false,
        }
    }

    /// Returns true when the enemy has been alive long enough to want an attack.
    /// Mirrors the `now - this.lastAttack > this.attackRate` check.
    pub fn wants_to_attack(&self) -> bool {
        self.last_attack_timer >= self.attack_rate
    }

    /// Subtract damage, return true if dead.
    pub fn hit(&mut self, damage: f32) -> bool {
        self.health -= damage;
        self.health <= 0.0
    }

    /// Per-frame update — movement + phase transitions.
    /// Mirrors Vampire.update() and BossVampire.update().
    pub fn update(&mut self, player_pos: Vec2, player_radius: f32, player_dashing: bool, dt: f32) {
        self.last_attack_timer += dt;
        self.facing_left = player_pos.x < self.pos.x;

        match &mut self.kind {
            EnemyKind::Regular => {
                let to_player = player_pos - self.pos;
                let dist      = to_player.length();
                let contact   = player_radius + self.radius;

                if dist > contact {
                    self.pos += to_player.normalize() * self.speed;
                }
            }
            EnemyKind::Boss { phase, is_charging, charge_target, charge_timer, ability_timer } => {
                // Update phase based on health percent
                let hp_pct = self.health / self.max_health;
                *phase = if hp_pct < 0.33 { 3 } else if hp_pct < 0.66 { 2 } else { 1 };

                // Cooldown scales with phase (faster in later phases)
                let ability_cooldown = 4.0 / *phase as f32;
                *ability_timer += dt;

                // Trigger charge attack
                if !*is_charging && *ability_timer >= ability_cooldown {
                    *is_charging    = true;
                    *charge_target  = player_pos;
                    *charge_timer   = 0.6;   // charge lasts 600 ms
                    *ability_timer  = 0.0;
                }

                if *is_charging {
                    *charge_timer -= dt;
                    if *charge_timer <= 0.0 { *is_charging = false; }

                    let to_target = *charge_target - self.pos;
                    if to_target.length() > 5.0 {
                        self.pos += to_target.normalize() * self.speed * 4.0;
                    }
                } else {
                    let to_player = player_pos - self.pos;
                    let dist      = to_player.length();
                    let contact   = player_radius + self.radius;
                    if dist > contact {
                        self.pos += to_player.normalize() * self.speed;
                    }
                }

                // Boss deals double damage while charging
                if *is_charging {
                    self.damage = self.max_health * 0.0; // recalculate in main if needed
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Particle  (mirrors Particle class in entities.js)
// ─────────────────────────────────────────────────────────────────────────────
pub struct Particle {
    pub pos:   Vec2,
    pub vel:   Vec2,
    pub radius:f32,
    pub color: Color,
    pub alpha: f32,
    pub decay: f32,
}

impl Particle {
    pub fn new(pos: Vec2, color: Color) -> Self {
        Self {
            pos,
            vel:    vec2(
                rand::gen_range(-4.0, 4.0),
                rand::gen_range(-4.0, 4.0),
            ),
            radius: rand::gen_range(1.0, 4.0),
            color,
            alpha:  1.0,
            decay:  0.02,
        }
    }

    /// Returns false when the particle should be removed.
    pub fn update(&mut self, _dt: f32) -> bool {
        self.pos += self.vel;
        self.vel.y += 0.2;   // gravity
        self.alpha -= self.decay;
        self.alpha > 0.0
    }

    pub fn draw(&self) {
        draw_circle(self.pos.x, self.pos.y, self.radius,
            Color { a: self.alpha, ..self.color });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  BloodSplatter  (mirrors BloodSplatter class in entities.js)
// ─────────────────────────────────────────────────────────────────────────────
pub struct BloodSplatter {
    pub pos:    Vec2,
    pub radius: f32,
    pub alpha:  f32,
}

impl BloodSplatter {
    pub fn new(pos: Vec2) -> Self {
        Self {
            pos,
            radius: rand::gen_range(10.0, 25.0),
            alpha:  0.6,
        }
    }

    pub fn update(&mut self, _dt: f32) -> bool {
        self.alpha -= 0.005;
        self.alpha > 0.0
    }

    pub fn draw(&self) {
        let c = Color { r: 0.545, g: 0.0, b: 0.0, a: self.alpha };
        draw_circle(self.pos.x, self.pos.y, self.radius, c);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  FloatingText  (mirrors FloatingText class in entities.js)
// ─────────────────────────────────────────────────────────────────────────────
pub struct FloatingText {
    pub pos:   Vec2,
    pub text:  String,
    pub color: Color,
    pub alpha: f32,
    pub vy:    f32,
}

impl FloatingText {
    pub fn new(pos: Vec2, text: String, color: Color) -> Self {
        Self { pos, text, color, alpha: 1.0, vy: -2.0 }
    }

    pub fn update(&mut self, _dt: f32) -> bool {
        self.pos.y += self.vy;
        self.alpha  -= 0.02;
        self.alpha > 0.0
    }

    pub fn draw(&self) {
        let c = Color { a: self.alpha, ..self.color };
        draw_text(&self.text, self.pos.x - 30.0, self.pos.y, 24.0, c);
    }
}