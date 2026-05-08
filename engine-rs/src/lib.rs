// Vampire Siege — headless simulation engine compiled to WebAssembly.
// Owns the per-frame world state. The React/JS layer drives input, audio,
// rendering, and wave/upgrade orchestration.

use glam::Vec2;
use wasm_bindgen::prelude::*;

// --- Tiny PRNG (avoids pulling in `rand` + `getrandom` on wasm) ----------
struct Rng(u32);
impl Rng {
    fn new(seed: u32) -> Self { Self(seed.max(1)) }
    fn next(&mut self) -> u32 {
        // xorshift32
        let mut x = self.0;
        x ^= x << 13;
        x ^= x >> 17;
        x ^= x << 5;
        self.0 = x;
        x
    }
    fn frand(&mut self) -> f32 { (self.next() >> 8) as f32 / ((1u32 << 24) as f32) }
    fn range(&mut self, lo: f32, hi: f32) -> f32 { lo + (hi - lo) * self.frand() }
}

// --- Event bitflags returned from step() ---------------------------------
#[wasm_bindgen]
pub struct StepEvents {
    bits: u32,
    damage_taken: f32,
    shake: f32,
}
#[wasm_bindgen]
impl StepEvents {
    #[wasm_bindgen(getter)] pub fn bits(&self) -> u32 { self.bits }
    #[wasm_bindgen(getter)] pub fn damage_taken(&self) -> f32 { self.damage_taken }
    #[wasm_bindgen(getter)] pub fn shake(&self) -> f32 { self.shake }
}
const EV_PLAYER_HURT: u32 = 1 << 0;
const EV_GAME_OVER:   u32 = 1 << 1;

// --- Player --------------------------------------------------------------
struct Player {
    pos: Vec2,
    radius: f32,
    size: f32,
    health: f32,
    max_health: f32,
    speed: f32,
    angle: f32,
    is_dashing: bool,
    dash_cooldown: f32,
    max_dash_cooldown: f32,
    dash_speed: f32,
    dash_energy: f32,
    max_dash_energy: f32,
    dash_energy_regen: f32,
    weapon_damage: f32,
    fire_rate_ms: f32,
    last_shot_ms: f32,
    piercing: u32,
}

impl Player {
    fn new() -> Self {
        Self {
            pos: Vec2::ZERO,
            radius: 30.0, size: 60.0,
            health: 100.0, max_health: 100.0,
            speed: 5.0, angle: 0.0,
            is_dashing: false,
            dash_cooldown: 0.0, max_dash_cooldown: 4000.0,
            dash_speed: 15.0,
            dash_energy: 100.0, max_dash_energy: 100.0,
            dash_energy_regen: 0.5,
            weapon_damage: 50.0,
            fire_rate_ms: 300.0,
            last_shot_ms: -1e9,
            piercing: 0,
        }
    }
}

// --- Enemy (Vampire / Boss) ----------------------------------------------
#[derive(Clone, Copy, PartialEq, Eq)]
enum EnemyKind { Vampire, Boss }

struct Enemy {
    pos: Vec2,
    radius: f32,
    size: f32,
    health: f32,
    max_health: f32,
    speed: f32,
    damage: f32,
    score_value: f32,
    kind: EnemyKind,
    last_attack_ms: f32,
    attack_rate_ms: f32,
    // Boss-only:
    last_ability_ms: f32,
    ability_cooldown_ms: f32,
    is_charging: bool,
    charge_target: Vec2,
    charge_until_ms: f32,
    charge_speed: f32,
    phase: u8,
    facing_left: bool,
}

// --- Particles / blood / floating text -----------------------------------
#[derive(Clone, Copy)]
struct Particle { pos: Vec2, vel: Vec2, radius: f32, alpha: f32, decay: f32, color: u32 /* 0xRRGGBB */ }
#[derive(Clone, Copy)]
struct Blood    { pos: Vec2, radius: f32, alpha: f32, decay: f32, satellites: [(f32, f32, f32); 3] }
#[derive(Clone)]
struct FloatText{ pos: Vec2, text: String, color: String, alpha: f32, vy: f32 }

// --- Hitscan result entries ----------------------------------------------
#[derive(Clone, Copy)]
struct HitInfo  { x: f32, y: f32, angle: f32, killed: u32 /* bool */, score: f32 }

// --- Engine --------------------------------------------------------------
#[wasm_bindgen]
pub struct Engine {
    canvas_w: f32,
    canvas_h: f32,
    now_ms: f32,
    player: Player,
    enemies: Vec<Enemy>,
    particles: Vec<Particle>,
    blood: Vec<Blood>,
    texts: Vec<FloatText>,
    enemies_buf: Vec<f32>,    // SoA flat buffer for JS rendering
    particles_buf: Vec<f32>,
    blood_buf: Vec<f32>,
    hits: Vec<HitInfo>,       // result of last fire_hitscan()
    rng: Rng,
}

const ENEMY_STRIDE: usize    = 9; // x,y,radius,size,hp,max_hp,kind,facing_left,is_charging
const PARTICLE_STRIDE: usize = 7; // x,y,radius,alpha,r,g,b
const BLOOD_STRIDE: usize    = 13; // x,y,radius,alpha + 3×(sat_ox,sat_oy,sat_radius)
#[allow(dead_code)]
const _ASSERT: () = ();

#[wasm_bindgen]
impl Engine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Engine {
        Engine {
            canvas_w: 800.0, canvas_h: 600.0,
            now_ms: 0.0,
            player: Player::new(),
            enemies: Vec::new(),
            particles: Vec::new(),
            blood: Vec::new(),
            texts: Vec::new(),
            enemies_buf: Vec::new(),
            particles_buf: Vec::new(),
            blood_buf: Vec::new(),
            hits: Vec::new(),
            rng: Rng::new(0xCAFEBABE),
        }
    }

    // ── World setup ─────────────────────────────────────────────────────
    pub fn set_canvas_size(&mut self, w: f32, h: f32) {
        self.canvas_w = w;
        self.canvas_h = h;
    }

    pub fn reset_world(&mut self) {
        self.enemies.clear();
        self.particles.clear();
        self.blood.clear();
        self.texts.clear();
        self.hits.clear();
        self.player.pos = Vec2::new(self.canvas_w * 0.5, self.canvas_h * 0.5);
        self.player.is_dashing = false;
        self.player.dash_cooldown = 0.0;
        self.player.dash_energy = self.player.max_dash_energy;
        self.player.last_shot_ms = -1e9;
    }

    // ── Player stats (called when starting / on upgrade) ────────────────
    pub fn set_player_stats(&mut self,
        max_health: f32, speed: f32,
        max_dash_cooldown_ms: f32, fire_rate_ms: f32,
        damage: f32, piercing: u32)
    {
        self.player.max_health = max_health;
        self.player.health = max_health;
        self.player.speed = speed;
        self.player.max_dash_cooldown = max_dash_cooldown_ms;
        self.player.fire_rate_ms = fire_rate_ms;
        self.player.weapon_damage = damage;
        self.player.piercing = piercing;
    }
    pub fn set_player_health(&mut self, hp: f32) { self.player.health = hp; }
    pub fn heal_full(&mut self) { self.player.health = self.player.max_health; }
    pub fn add_max_health(&mut self, new_max: f32, heal: f32) {
        self.player.max_health = new_max;
        self.player.health = (self.player.health + heal).min(new_max);
    }

    // ── Player getters (for HUD & rendering) ────────────────────────────
    pub fn player_x(&self) -> f32 { self.player.pos.x }
    pub fn player_y(&self) -> f32 { self.player.pos.y }
    pub fn player_angle(&self) -> f32 { self.player.angle }
    pub fn player_health(&self) -> f32 { self.player.health }
    pub fn player_max_health(&self) -> f32 { self.player.max_health }
    pub fn player_dash_energy(&self) -> f32 { self.player.dash_energy }
    pub fn player_max_dash_energy(&self) -> f32 { self.player.max_dash_energy }
    pub fn player_dash_cooldown(&self) -> f32 { self.player.dash_cooldown }
    pub fn player_max_dash_cooldown(&self) -> f32 { self.player.max_dash_cooldown }
    pub fn player_is_dashing(&self) -> bool { self.player.is_dashing }
    pub fn player_size(&self) -> f32 { self.player.size }

    // ── Dash control ────────────────────────────────────────────────────
    pub fn try_dash(&mut self) -> bool {
        if !self.player.is_dashing && self.player.dash_energy >= 50.0 {
            self.player.is_dashing = true;
            self.player.dash_energy = (self.player.dash_energy - 50.0).max(0.0);
            self.player.dash_cooldown = self.player.max_dash_cooldown;
            // dash trail particles
            for _ in 0..20 {
                self.particles.push(Particle {
                    pos: self.player.pos,
                    vel: Vec2::new(self.rng.range(-4.0, 4.0), self.rng.range(-4.0, 4.0)),
                    radius: self.rng.range(1.0, 4.0),
                    alpha: 1.0, decay: 0.02,
                    color: 0x4a90e2,
                });
            }
            return true;
        }
        false
    }
    pub fn end_dash(&mut self) { self.player.is_dashing = false; }

    // ── Enemy spawn (called by JS wave scheduler) ───────────────────────
    pub fn spawn_vampire(&mut self, x: f32, y: f32,
        hp: f32, speed: f32, damage: f32, score_value: f32)
    {
        self.enemies.push(Enemy {
            pos: Vec2::new(x, y),
            radius: 30.0, size: 60.0,
            health: hp, max_health: hp,
            speed, damage, score_value,
            kind: EnemyKind::Vampire,
            last_attack_ms: -1e9,
            attack_rate_ms: 1000.0,
            last_ability_ms: 0.0, ability_cooldown_ms: 0.0,
            is_charging: false, charge_target: Vec2::ZERO,
            charge_until_ms: 0.0, charge_speed: 0.0,
            phase: 1, facing_left: false,
        });
    }

    pub fn spawn_boss(&mut self, x: f32, y: f32,
        hp: f32, speed: f32, damage: f32, score_value: f32)
    {
        self.enemies.push(Enemy {
            pos: Vec2::new(x, y),
            radius: 50.0, size: 100.0,
            health: hp, max_health: hp,
            speed, damage, score_value,
            kind: EnemyKind::Boss,
            last_attack_ms: -1e9,
            attack_rate_ms: 800.0,
            last_ability_ms: 0.0,
            ability_cooldown_ms: 4000.0,
            is_charging: false,
            charge_target: Vec2::ZERO,
            charge_until_ms: 0.0,
            charge_speed: speed * 4.0,
            phase: 1, facing_left: false,
        });
    }

    pub fn enemy_count(&self) -> usize { self.enemies.len() }
    pub fn clear_enemies(&mut self) { self.enemies.clear(); }

    // ── Per-frame step ─────────────────────────────────────────────────
    // dt_ms : milliseconds since last step (typically ~16.67 at 60fps)
    // move_x / move_y : raw input vector (unnormalized; engine normalizes)
    // mouse_x / mouse_y : in canvas-local coords
    pub fn step(&mut self, dt_ms: f32,
        move_x: f32, move_y: f32,
        mouse_x: f32, mouse_y: f32) -> StepEvents
    {
        self.now_ms += dt_ms;
        let mut events = 0u32;
        let mut damage_taken = 0.0f32;
        let mut shake = 0.0f32;

        // Dash cooldown & energy regen
        if self.player.dash_cooldown > 0.0 {
            self.player.dash_cooldown = (self.player.dash_cooldown - dt_ms).max(0.0);
        }
        if self.player.dash_energy < self.player.max_dash_energy {
            self.player.dash_energy = (self.player.dash_energy
                + self.player.dash_energy_regen).min(self.player.max_dash_energy);
        }

        // Player movement
        let mvec = Vec2::new(move_x, move_y);
        if mvec.length_squared() > 0.0001 {
            let dir = mvec.normalize();
            let cur_speed = if self.player.is_dashing { self.player.dash_speed } else { self.player.speed };
            self.player.pos += dir * cur_speed;
            if self.player.is_dashing {
                self.particles.push(Particle {
                    pos: self.player.pos,
                    vel: Vec2::new(self.rng.range(-4.0,4.0), self.rng.range(-4.0,4.0)),
                    radius: self.rng.range(1.0,4.0),
                    alpha: 1.0, decay: 0.02,
                    color: 0x4a90e2,
                });
            }
            let margin = self.player.size * 0.5 + 5.0;
            self.player.pos.x = self.player.pos.x.clamp(margin, self.canvas_w - margin);
            self.player.pos.y = self.player.pos.y.clamp(margin, self.canvas_h - margin);
        }

        // Aim angle
        self.player.angle = (mouse_y - self.player.pos.y)
            .atan2(mouse_x - self.player.pos.x);

        // Enemy update
        let now = self.now_ms;
        let p_pos = self.player.pos;
        let p_radius = self.player.radius;
        let p_dashing = self.player.is_dashing;
        let mut player_dead = false;

        for e in self.enemies.iter_mut() {
            let to_player = p_pos - e.pos;
            let dist = to_player.length();
            e.facing_left = to_player.x < 0.0;

            if e.kind == EnemyKind::Boss {
                // phase update
                let pct = e.health / e.max_health;
                if pct < 0.33 { e.phase = 3; } else if pct < 0.66 { e.phase = 2; }

                // start charge?
                if !e.is_charging && now - e.last_ability_ms > e.ability_cooldown_ms / e.phase as f32 {
                    e.is_charging = true;
                    e.charge_target = p_pos;
                    e.last_ability_ms = now;
                    e.charge_until_ms = now + 600.0;
                }
                if e.is_charging && now > e.charge_until_ms {
                    e.is_charging = false;
                }
            }

            // Movement
            if e.is_charging {
                let cdir = e.charge_target - e.pos;
                let cdist = cdir.length();
                if cdist > 5.0 {
                    e.pos += (cdir / cdist) * e.charge_speed;
                }
            } else if dist > p_radius + e.radius {
                e.pos += (to_player / dist.max(0.0001)) * e.speed;
            }

            // Attack
            if dist <= p_radius + e.radius && !p_dashing {
                if now - e.last_attack_ms > e.attack_rate_ms {
                    let dmg = if e.kind == EnemyKind::Boss {
                        if e.is_charging { e.damage * 2.0 } else { e.damage }
                    } else { e.damage };
                    self.player.health -= dmg;
                    e.last_attack_ms = now;
                    damage_taken += dmg;
                    events |= EV_PLAYER_HURT;
                    shake = shake.max(if e.kind == EnemyKind::Boss { 3.0 } else { 2.0 });
                    if self.player.health <= 0.0 {
                        player_dead = true;
                    }
                }
            }

            // Boss: stay in bounds
            if e.kind == EnemyKind::Boss {
                e.pos.x = e.pos.x.clamp(e.radius, self.canvas_w - e.radius);
                e.pos.y = e.pos.y.clamp(e.radius, self.canvas_h - e.radius);
            }
        }

        if player_dead {
            events |= EV_GAME_OVER;
        }

        // Particle / blood / text decay (with caps)
        if self.particles.len() > 200 {
            let drop = self.particles.len() - 200;
            self.particles.drain(0..drop);
        }
        self.particles.retain_mut(|p| {
            p.pos += p.vel;
            p.vel.y += 0.2;
            p.alpha -= p.decay;
            p.alpha > 0.0
        });

        if self.blood.len() > 30 {
            let drop = self.blood.len() - 30;
            self.blood.drain(0..drop);
        }
        self.blood.retain_mut(|b| { b.alpha -= b.decay; b.alpha > 0.0 });

        self.texts.retain_mut(|t| {
            t.pos.y += t.vy;
            t.alpha -= 0.02;
            t.alpha > 0.0
        });

        StepEvents { bits: events, damage_taken, shake }
    }

    // ── Hitscan firing (called when JS detects shoot) ───────────────────
    // Returns 0 = could not fire (cooldown), >0 = number of enemies hit.
    pub fn fire_hitscan(&mut self) -> u32 {
        if self.now_ms - self.player.last_shot_ms < self.player.fire_rate_ms {
            return u32::MAX; // cooldown
        }
        self.player.last_shot_ms = self.now_ms;
        self.hits.clear();

        let dir = Vec2::new(self.player.angle.cos(), self.player.angle.sin());
        let start = self.player.pos;
        let mut pierce_left = self.player.piercing as i32;

        // Build candidate list of (enemy_index, projection) sorted by projection
        let mut order: Vec<(usize, f32)> = Vec::with_capacity(self.enemies.len());
        for (i, e) in self.enemies.iter().enumerate() {
            let to = e.pos - start;
            let proj = to.dot(dir);
            if proj < 0.0 { continue; }
            let closest = start + dir * proj;
            let d = (e.pos - closest).length();
            if d <= e.radius {
                order.push((i, proj));
            }
        }
        order.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap());

        // Apply damage in order; collect events; remove dead enemies after
        let mut to_remove: Vec<usize> = Vec::new();
        let dmg = self.player.weapon_damage;

        // Muzzle flash particles
        for _ in 0..3 {
            self.particles.push(Particle {
                pos: start + dir * 20.0,
                vel: Vec2::new(self.rng.range(-2.0, 2.0), self.rng.range(-2.0, 2.0)),
                radius: self.rng.range(1.0, 3.0),
                alpha: 1.0, decay: 0.04,
                color: 0xffaa00,
            });
        }

        for (idx, _) in order.iter() {
            let e = &mut self.enemies[*idx];
            e.health -= dmg;
            let killed = e.health <= 0.0;
            let hit_angle = (e.pos.y - start.y).atan2(e.pos.x - start.x) + std::f32::consts::PI;
            self.hits.push(HitInfo {
                x: e.pos.x, y: e.pos.y,
                angle: hit_angle,
                killed: if killed {1} else {0},
                score: e.score_value,
            });
            if killed {
                // blood + particles + floating text
                let blood_r = self.rng.range(10.0, 25.0);
                let mut sats = [(0f32, 0f32, 0f32); 3];
                for i in 0..3 {
                    let angle = self.rng.frand() * std::f32::consts::TAU;
                    let dist  = self.rng.frand() * blood_r;
                    let sr    = self.rng.range(2.0, 7.0);
                    sats[i]   = (angle.cos() * dist, angle.sin() * dist, sr);
                }
                self.blood.push(Blood {
                    pos: e.pos,
                    radius: blood_r,
                    alpha: 0.6, decay: 0.005,
                    satellites: sats,
                });
                for _ in 0..15 {
                    self.particles.push(Particle {
                        pos: e.pos,
                        vel: Vec2::new(self.rng.range(-4.0,4.0), self.rng.range(-4.0,4.0)),
                        radius: self.rng.range(1.0,4.0),
                        alpha: 1.0, decay: 0.02,
                        color: 0x8b0000,
                    });
                }
                self.texts.push(FloatText {
                    pos: e.pos,
                    text: format!("+{}", e.score_value as i32),
                    color: "#ffff00".into(),
                    alpha: 1.0, vy: -2.0,
                });
                to_remove.push(*idx);
            }
            pierce_left -= 1;
            if pierce_left < 0 { break; }
        }

        // Remove dead enemies (back-to-front)
        to_remove.sort_unstable_by(|a, b| b.cmp(a));
        for i in to_remove { self.enemies.swap_remove(i); }

        self.hits.len() as u32
    }

    // Hit results readers
    pub fn hits_count(&self) -> u32 { self.hits.len() as u32 }
    pub fn hit_x(&self, i: u32) -> f32 { self.hits[i as usize].x }
    pub fn hit_y(&self, i: u32) -> f32 { self.hits[i as usize].y }
    pub fn hit_angle(&self, i: u32) -> f32 { self.hits[i as usize].angle }
    pub fn hit_killed(&self, i: u32) -> u32 { self.hits[i as usize].killed }
    pub fn hit_score(&self, i: u32) -> f32 { self.hits[i as usize].score }

    // ── Rendering buffers (called once per frame after step) ────────────
    // Repacks live entities into flat f32 SoA buffers; returns memory ptr.

    pub fn build_render_buffers(&mut self) {
        self.enemies_buf.clear();
        self.enemies_buf.reserve(self.enemies.len() * ENEMY_STRIDE);
        for e in self.enemies.iter() {
            self.enemies_buf.push(e.pos.x);
            self.enemies_buf.push(e.pos.y);
            self.enemies_buf.push(e.radius);
            self.enemies_buf.push(e.size);
            self.enemies_buf.push(e.health);
            self.enemies_buf.push(e.max_health);
            self.enemies_buf.push(if e.kind == EnemyKind::Boss {1.0} else {0.0});
            self.enemies_buf.push(if e.facing_left {1.0} else {0.0});
            self.enemies_buf.push(if e.is_charging {1.0} else {0.0});
        }

        self.particles_buf.clear();
        self.particles_buf.reserve(self.particles.len() * PARTICLE_STRIDE);
        for p in self.particles.iter() {
            self.particles_buf.push(p.pos.x);
            self.particles_buf.push(p.pos.y);
            self.particles_buf.push(p.radius);
            self.particles_buf.push(p.alpha);
            self.particles_buf.push(((p.color >> 16) & 0xff) as f32 / 255.0);
            self.particles_buf.push(((p.color >> 8) & 0xff) as f32 / 255.0);
            self.particles_buf.push((p.color & 0xff) as f32 / 255.0);
        }

        self.blood_buf.clear();
        self.blood_buf.reserve(self.blood.len() * BLOOD_STRIDE);
        for b in self.blood.iter() {
            self.blood_buf.push(b.pos.x);
            self.blood_buf.push(b.pos.y);
            self.blood_buf.push(b.radius);
            self.blood_buf.push(b.alpha);
            for (ox, oy, sr) in b.satellites.iter() {
                self.blood_buf.push(*ox);
                self.blood_buf.push(*oy);
                self.blood_buf.push(*sr);
            }
        }
    }

    pub fn enemies_ptr(&self) -> *const f32 { self.enemies_buf.as_ptr() }
    pub fn enemies_len(&self) -> u32 { self.enemies.len() as u32 }
    pub fn enemy_stride(&self) -> u32 { ENEMY_STRIDE as u32 }

    pub fn particles_ptr(&self) -> *const f32 { self.particles_buf.as_ptr() }
    pub fn particles_len(&self) -> u32 { self.particles.len() as u32 }
    pub fn particle_stride(&self) -> u32 { PARTICLE_STRIDE as u32 }

    pub fn blood_ptr(&self) -> *const f32 { self.blood_buf.as_ptr() }
    pub fn blood_len(&self) -> u32 { self.blood.len() as u32 }
    pub fn blood_stride(&self) -> u32 { BLOOD_STRIDE as u32 }

    // Floating text — copied to JS one-by-one (small count, infrequent)
    pub fn texts_count(&self) -> u32 { self.texts.len() as u32 }
    pub fn text_x(&self, i: u32) -> f32 { self.texts[i as usize].pos.x }
    pub fn text_y(&self, i: u32) -> f32 { self.texts[i as usize].pos.y }
    pub fn text_alpha(&self, i: u32) -> f32 { self.texts[i as usize].alpha }
    pub fn text_str(&self, i: u32) -> String { self.texts[i as usize].text.clone() }
    pub fn text_color(&self, i: u32) -> String { self.texts[i as usize].color.clone() }

    pub fn add_floating_text(&mut self, x: f32, y: f32, text: &str, color: &str) {
        self.texts.push(FloatText {
            pos: Vec2::new(x, y),
            text: text.to_string(),
            color: color.to_string(),
            alpha: 1.0, vy: -2.0,
        });
    }
}
