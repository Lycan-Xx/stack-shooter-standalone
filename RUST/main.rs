// ═══════════════════════════════════════════════════════════════════════════
//  vampire_siege  —  main.rs
//  Entry point + game loop (mirrors useGameLoop.js)
//
//  JS → Rust mental model:
//    requestAnimationFrame callback  →  loop { next_frame().await }
//    useRef(value)                   →  a plain variable (Rust owns it)
//    useState(value)                 →  GameState enum  (no re-render cost)
//    class Vampire { update() }      →  struct Vampire  +  impl Vampire
// ═══════════════════════════════════════════════════════════════════════════

use macroquad::prelude::*;

mod config;      // difficulty.rs  +  upgrades.rs  (the "rulebook")
mod entities;    // vampire, boss, bullet, particle …
mod draw;        // svgCharacters.js equivalent
mod effects;     // visualEffects.js equivalent
mod input;       // keyboard / touch / joystick normalisation
mod tutorial;    // tutorial state-machine
mod hud;         // HUD rendering (replaces HUD.jsx)
mod audio;       // sound.js equivalent (stub — see audio.rs)

use config::{DIFFICULTIES, UpgradeKey};
use entities::{Player, Enemy, Particle, BloodSplatter, FloatingText};
use effects::{RicochetEffect, DamageNumber, HitMarker};
use input::InputState;
use tutorial::TutorialState;
use config::upgrades::apply_upgrade;

// ── Top-level game state machine ─────────────────────────────────────────────
// JS equivalent: game.state = 'playing' | 'start' | 'upgrade' | 'gameOver'
#[derive(Debug, Clone, PartialEq)]
pub enum Phase {
    Start,
    Playing,
    Tutorial,
    Upgrade,
    GameOver,
    Paused,
}

// ── Everything the game loop needs, owned in one place ──────────────────────
// JS equivalent: all the useRef() values + top-level variables in useGameLoop
pub struct GameWorld {
    pub phase:            Phase,
    pub wave:             u32,
    pub kills:            u32,
    pub score:            u32,
    pub difficulty_key:   String,

    pub player:           Player,
    pub enemies:          Vec<Enemy>,
    pub particles:        Vec<Particle>,
    pub blood_splatters:  Vec<BloodSplatter>,
    pub floating_texts:   Vec<FloatingText>,
    pub ricochet_effects: Vec<RicochetEffect>,
    pub hit_markers:      Vec<HitMarker>,
    pub damage_numbers:   Vec<DamageNumber>,

    // Laser flash lines — same as game.lasers[] in JS
    pub lasers:           Vec<LaserFlash>,

    // Wave bookkeeping — mirrors game.expectedEnemies / spawnedEnemies
    pub wave_in_progress:   bool,
    pub waiting_next_wave:  bool,
    pub expected_enemies:   u32,
    pub spawned_enemies:    u32,

    pub tutorial:           TutorialState,

    // Upgrade choices shown on screen
    pub upgrade_choices:    Vec<UpgradeKey>,

    // Time accumulator so we can do frame-rate-independent physics
    // (JS used Date.now() deltas; here macroquad gives us get_frame_time())
    pub elapsed:            f32,
}

// A single laser-flash visual (drawn for ~100 ms then removed)
pub struct LaserFlash {
    pub start: Vec2,
    pub end:   Vec2,
    pub alpha: f32,
    pub age:   f32,   // seconds since creation
}

// ── Spawn helpers ─────────────────────────────────────────────────────────────
fn spawn_position(screen_w: f32, screen_h: f32) -> Vec2 {
    // Mirror of the switch(side) block in spawnWave()
    let side = rand::gen_range(0u8, 4);
    match side {
        0 => vec2(rand::gen_range(0.0, screen_w), -50.0),
        1 => vec2(screen_w + 50.0, rand::gen_range(0.0, screen_h)),
        2 => vec2(rand::gen_range(0.0, screen_w), screen_h + 50.0),
        _ => vec2(-50.0, rand::gen_range(0.0, screen_h)),
    }
}

fn spawn_wave(world: &mut GameWorld, screen_w: f32, screen_h: f32) {
    if world.wave_in_progress { return; }

    world.wave_in_progress   = true;
    world.waiting_next_wave  = false;

    let diff = DIFFICULTIES.get(&world.difficulty_key)
        .expect("unknown difficulty");

    // Base enemy count grows with wave, same formula as JS:
    // baseEnemies + floor((wave-1) * 0.5)
    let base = if world.phase == Phase::Tutorial { 1 } else { diff.enemies_per_wave };
    let num_enemies = base + ((world.wave.saturating_sub(1)) as f32 * 0.5) as u32;

    // Boss every 3rd wave (wave 3, 6, 9 …)
    let is_boss = world.wave % 3 == 0 && world.phase == Phase::Playing;

    if is_boss {
        world.expected_enemies = 1;
        world.spawned_enemies  = 0;
        let pos = spawn_position(screen_w, screen_h);
        world.enemies.push(Enemy::new_boss(
            pos,
            world.wave,
            diff,
            num_enemies,
        ));
        world.spawned_enemies = 1;
    } else {
        world.expected_enemies = num_enemies;
        world.spawned_enemies  = 0;
        // Stagger spawns using a simple counter-based delay
        // (JS used setTimeout(fn, i * 400); here we tag each enemy with
        //  a spawn_delay so the update loop holds them off-screen)
        for i in 0..num_enemies {
            let pos = spawn_position(screen_w, screen_h);
            let mut enemy = Enemy::new_vampire(pos, world.wave, diff);
            enemy.spawn_delay = i as f32 * 0.4; // 0.4 s between spawns
            world.enemies.push(enemy);
        }
    }
}

fn init_game(world: &mut GameWorld, screen_w: f32, screen_h: f32) {
    let diff = DIFFICULTIES.get(&world.difficulty_key)
        .expect("unknown difficulty");

    world.wave              = 1;
    world.kills             = 0;
    world.score             = 0;
    world.wave_in_progress  = false;
    world.waiting_next_wave = false;
    world.expected_enemies  = 0;
    world.spawned_enemies   = 0;

    world.enemies.clear();
    world.particles.clear();
    world.blood_splatters.clear();
    world.floating_texts.clear();
    world.ricochet_effects.clear();
    world.hit_markers.clear();
    world.damage_numbers.clear();
    world.lasers.clear();

    world.player = Player::new(screen_w / 2.0, screen_h / 2.0, diff);
    spawn_wave(world, screen_w, screen_h);
}

// ─────────────────────────────────────────────────────────────────────────────
//  UPDATE  —  called every frame while Playing or Tutorial
//  Mirrors the update() function in useGameLoop.js
// ─────────────────────────────────────────────────────────────────────────────
fn update(world: &mut GameWorld, input: &InputState, dt: f32, screen_w: f32, screen_h: f32) {

    // ── Dash cooldown + energy regen (mirrors the dashCooldown block) ──────
    let player = &mut world.player;
    if player.dash_cooldown > 0.0 {
        player.dash_cooldown = (player.dash_cooldown - dt).max(0.0);
    }
    if player.dash_energy < player.max_dash_energy {
        player.dash_energy = (player.dash_energy + player.dash_energy_regen * dt * 60.0)
            .min(player.max_dash_energy);
    }
    if player.is_dashing {
        player.dash_timer -= dt;
        if player.dash_timer <= 0.0 {
            player.is_dashing = false;
        }
    }

    // ── Player movement (WASD + joystick, mirrors the moveX/moveY block) ──
    let move_dir = input.move_dir(); // normalised Vec2 from keys or joystick
    if move_dir.length() > 0.01 {
        let speed = if player.is_dashing { player.dash_speed } else { player.speed };
        player.pos += move_dir.normalize() * speed;

        if player.is_dashing {
            world.particles.push(Particle::new(player.pos, BLUE));
        }

        let margin = player.size / 2.0 + 5.0;
        player.pos.x = player.pos.x.clamp(margin, screen_w - margin);
        player.pos.y = player.pos.y.clamp(margin, screen_h - margin);
    }

    // Aim angle (mouse or touch aim point → atan2)
    let aim = input.aim_pos;
    world.player.angle = (aim - world.player.pos).to_angle();

    // ── Shoot (fire held or mobile fire active) ───────────────────────────
    if input.fire_held {
        try_shoot(world, input, dt);
    }

    // ── Enemy spawn delay bookkeeping ────────────────────────────────────
    for enemy in world.enemies.iter_mut() {
        if enemy.spawn_delay > 0.0 {
            enemy.spawn_delay -= dt;
            if enemy.spawn_delay <= 0.0 {
                enemy.spawn_delay = 0.0;
                world.spawned_enemies += 1;
            }
        }
    }

    // ── Enemy update ─────────────────────────────────────────────────────
    // We collect kill/hit results and process them after the loop to avoid
    // borrow-checker conflicts (can't borrow world.player while iterating
    // world.enemies mutably).
    let player_pos  = world.player.pos;
    let player_r    = world.player.radius;
    let is_dashing  = world.player.is_dashing;
    let mut player_took_damage = 0.0f32;
    let mut game_over = false;

    for enemy in world.enemies.iter_mut() {
        if enemy.spawn_delay > 0.0 { continue; } // not yet on screen

        enemy.update(player_pos, player_r, is_dashing, dt);

        // Enemy melee attack — mirrors the `dist <= player.radius + enemy.radius` block
        if enemy.wants_to_attack() {
            player_took_damage += enemy.damage;
            enemy.last_attack_timer = 0.0;
        }
    }

    if player_took_damage > 0.0 {
        world.player.health -= player_took_damage;
        audio::play("playerHurt");
        if world.player.health <= 0.0 {
            game_over = true;
        }
    }

    if game_over {
        world.phase = Phase::GameOver;
        audio::play("gameOver");
        return;
    }

    // ── Particle / effect updates (mirrors the splice loops) ─────────────
    world.particles.retain_mut(|p| p.update(dt));
    world.blood_splatters.retain_mut(|b| b.update(dt));
    world.floating_texts.retain_mut(|t| t.update(dt));
    world.ricochet_effects.retain_mut(|r| r.update(dt));
    world.hit_markers.retain_mut(|h| h.update(dt));
    world.damage_numbers.retain_mut(|d| d.update(dt));
    world.lasers.retain_mut(|l| { l.age += dt; l.alpha = 1.0 - (l.age / 0.1); l.age < 0.1 });

    // Cap particle arrays (mirrors the if particles.length > 200 check)
    if world.particles.len()      > 200 { world.particles.drain(0..50); }
    if world.blood_splatters.len() > 30  { world.blood_splatters.drain(0..10); }
    if world.ricochet_effects.len()> 20  { world.ricochet_effects.drain(0..5); }

    // ── Wave completion ───────────────────────────────────────────────────
    // FIX: Extract plain booleans BEFORE any mutable borrow of world.
    // The old code kept `alive` (a Vec of references into world.enemies)
    // alive past the spawn_wave() call, which needs &mut world — Rust
    // forbids that overlap.  Collecting into plain values drops the borrow
    // immediately so spawn_wave() can take &mut world freely.
    let all_enemies_dead = world.enemies.iter().all(|e| e.spawn_delay > 0.0)
        || world.enemies.is_empty();
    // Count only enemies that have actually appeared on screen
    let active_enemy_count = world.enemies.iter()
        .filter(|e| e.spawn_delay <= 0.0)
        .count();
    let no_active_enemies = active_enemy_count == 0;
    let all_spawned = world.spawned_enemies >= world.expected_enemies;
    // ↑ `alive` Vec<&Enemy> is gone — no immutable borrow held past this point

    if no_active_enemies && world.wave_in_progress && !world.waiting_next_wave && all_spawned {
        world.wave_in_progress  = false;
        world.waiting_next_wave = true;

        // Full health restore on wave clear (same as JS)
        world.player.health = world.player.max_health;

        let diff = DIFFICULTIES.get(&world.difficulty_key).unwrap();
        let bonus = (50.0 * diff.score_multiplier) as u32;
        world.score += bonus;

        world.floating_texts.push(FloatingText::new(
            vec2(screen_w / 2.0, screen_h / 2.0),
            format!("Wave Complete! +{}", bonus),
            GREEN,
        ));

        audio::play("waveComplete");

        // Upgrade screen every 3rd wave (wave 3, 6, 9 …)
        if world.wave % 3 == 0 && world.phase == Phase::Playing {
            world.upgrade_choices = config::upgrades::random_upgrades(&world.player.upgrades, 3);
            world.phase = Phase::Upgrade;
        } else {
            world.wave += 1;
            world.waiting_next_wave = false;
            spawn_wave(world, screen_w, screen_h); // ✅ &mut world borrow is now safe
        }
    }

    // Tutorial wave completion (no mutable borrow needed here)
    if world.phase == Phase::Tutorial && no_active_enemies && all_spawned && !world.wave_in_progress {
        // tutorial.rs handles the next-step logic
    }
}

// ── Hitscan shoot (mirrors shoot() in useGameLoop.js) ──────────────────────
fn try_shoot(world: &mut GameWorld, _input: &InputState, _dt: f32) {
    let now = world.elapsed;
    let player = &mut world.player;

    if now - player.weapon.last_shot < player.weapon.fire_rate { return; }
    player.weapon.last_shot = now;

    let angle  = player.angle;
    let origin = player.pos;
    let dir    = Vec2::from_angle(angle);
    let damage = player.weapon.damage;
    let mut pierce = player.weapon.piercing as i32;

    audio::play("shoot");

    // Laser flash visual
    world.lasers.push(LaserFlash {
        start: origin,
        end:   origin + dir * 1000.0,
        alpha: 1.0,
        age:   0.0,
    });

    // Muzzle particles
    for _ in 0..3 {
        world.particles.push(Particle::new(origin + dir * 20.0, ORANGE));
    }

    // Hitscan: project every enemy onto the laser ray, check circle-vs-ray
    // This is a direct port of the JS loop:
    //   projection = dot(toEnemy, dir)
    //   closestPoint = origin + dir * projection
    //   distance = length(enemy.pos - closestPoint)
    //   if distance <= enemy.radius → hit
    let mut hits: Vec<usize> = vec![];
    for (i, enemy) in world.enemies.iter().enumerate() {
        if enemy.spawn_delay > 0.0 { continue; }
        let to_enemy  = enemy.pos - origin;
        let proj      = to_enemy.dot(dir);
        if proj < 0.0 { continue; }              // behind the player
        let closest   = origin + dir * proj;
        let dist      = (enemy.pos - closest).length();
        if dist <= enemy.radius {
            hits.push(i);
        }
    }

    // Sort hits by distance (nearest first) — same as JS implicit ordering
    hits.sort_by(|&a, &b| {
        let da = (world.enemies[a].pos - origin).length();
        let db = (world.enemies[b].pos - origin).length();
        da.partial_cmp(&db).unwrap()
    });

    // Apply damage with pierce logic
    let mut killed_indices: Vec<usize> = vec![];
    for &i in &hits {
        let killed = world.enemies[i].hit(damage);
        let enemy_pos = world.enemies[i].pos;
        let score_val = world.enemies[i].score_value;

        if killed {
            killed_indices.push(i);
            world.kills += 1;
            world.score += score_val;
            audio::play("enemyDeath");

            world.blood_splatters.push(BloodSplatter::new(enemy_pos));
            for _ in 0..15 {
                world.particles.push(Particle::new(enemy_pos, Color::from_hex(0x8b0000)));
            }
            world.floating_texts.push(FloatingText::new(
                enemy_pos,
                format!("+{}", score_val),
                YELLOW,
            ));
            world.damage_numbers.push(DamageNumber::new(enemy_pos, damage as u32, true, false));
        } else {
            audio::play("enemyHit");
            let hit_angle = (enemy_pos - origin).to_angle();
            world.ricochet_effects.push(RicochetEffect::new(enemy_pos, hit_angle + std::f32::consts::PI));
            world.damage_numbers.push(DamageNumber::new(enemy_pos, damage as u32, false, false));
        }

        pierce -= 1;
        if pierce < 0 { break; }
    }

    // Remove killed enemies (reverse order so indices stay valid)
    killed_indices.sort_unstable_by(|a, b| b.cmp(a));
    for i in killed_indices {
        world.enemies.remove(i);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  DRAW  —  called every frame
//  Mirrors the draw() function in useGameLoop.js
// ─────────────────────────────────────────────────────────────────────────────
fn render(world: &GameWorld, input: &InputState) {
    clear_background(Color::from_hex(0x1a0a00)); // dark background

    match world.phase {
        Phase::Start => {
            hud::draw_start_screen();
        }
        Phase::Playing | Phase::Tutorial => {
            // Aim line (dashed — mirrors ctx.setLineDash)
            draw::draw_aim_line(world.player.pos, input.aim_pos);

            // Player
            draw::draw_player(
                world.player.pos,
                world.player.size,
                world.player.angle,
                world.player.is_dashing,
            );

            // Enemies
            for enemy in &world.enemies {
                if enemy.spawn_delay > 0.0 { continue; }
                draw::draw_enemy(enemy);
            }

            // Laser flashes
            for laser in &world.lasers {
                draw_line(
                    laser.start.x, laser.start.y,
                    laser.end.x,   laser.end.y,
                    3.0,
                    Color { r: 1.0, g: 1.0, b: 0.0, a: laser.alpha },
                );
            }

            // Particles & effects
            for p  in &world.particles        { p.draw();  }
            for b  in &world.blood_splatters  { b.draw();  }
            for t  in &world.floating_texts   { t.draw();  }
            for r  in &world.ricochet_effects { r.draw();  }
            for h  in &world.hit_markers      { h.draw();  }
            for d  in &world.damage_numbers   { d.draw();  }

            // HUD overlay
            hud::draw_hud(
                world.player.health,
                world.player.max_health,
                world.wave,
                world.kills,
                world.score,
                world.player.dash_energy,
                world.player.max_dash_energy,
                &world.difficulty_key,
            );

            if world.phase == Phase::Tutorial {
                hud::draw_tutorial_overlay(&world.tutorial);
            }
        }
        Phase::Upgrade => {
            hud::draw_upgrade_screen(&world.upgrade_choices);
        }
        Phase::GameOver => {
            hud::draw_game_over(world.wave, world.kills, world.score, &world.difficulty_key);
        }
        Phase::Paused => {
            hud::draw_pause_menu();
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN  —  macroquad entry point
// ─────────────────────────────────────────────────────────────────────────────
#[macroquad::main("Vampire Siege")]
async fn main() {
    // Window config is set via the conf() function below
    let screen_w = screen_width();
    let screen_h = screen_height();

    let mut world = GameWorld {
        phase:            Phase::Start,
        wave:             1,
        kills:            0,
        score:            0,
        difficulty_key:   "normal".into(),

        player:           Player::default(),
        enemies:          vec![],
        particles:        vec![],
        blood_splatters:  vec![],
        floating_texts:   vec![],
        ricochet_effects: vec![],
        hit_markers:      vec![],
        damage_numbers:   vec![],
        lasers:           vec![],

        wave_in_progress:   false,
        waiting_next_wave:  false,
        expected_enemies:   0,
        spawned_enemies:    0,

        tutorial:           TutorialState::new(),
        upgrade_choices:    vec![],
        elapsed:            0.0,
    };

    let mut input = InputState::default();

    loop {
        let dt = get_frame_time(); // seconds since last frame (~0.016 at 60 fps)
        world.elapsed += dt;

        // ── Gather input ────────────────────────────────────────────────
        input.update(&world.player.pos);

        // ── State-machine transitions driven by input ────────────────────
        match world.phase.clone() {
            Phase::Start => {
                // Difficulty buttons — in a real build these are drawn by hud.rs
                // and the user clicks/taps; here we bootstrap with keyboard for now
                if is_key_pressed(KeyCode::Key1) { start_new_game(&mut world, "easy",      screen_w, screen_h); }
                if is_key_pressed(KeyCode::Key2) { start_new_game(&mut world, "normal",    screen_w, screen_h); }
                if is_key_pressed(KeyCode::Key3) { start_new_game(&mut world, "hard",      screen_w, screen_h); }
                if is_key_pressed(KeyCode::Key4) { start_new_game(&mut world, "nightmare", screen_w, screen_h); }
                if is_key_pressed(KeyCode::T)    { start_tutorial(&mut world, screen_w, screen_h); }
            }
            Phase::Playing | Phase::Tutorial => {
                if is_key_pressed(KeyCode::Escape) {
                    world.phase = Phase::Paused;
                }
                if input.dash_pressed {
                    try_dash(&mut world);
                }
                update(&mut world, &input, dt, screen_w, screen_h);
            }
            Phase::Paused => {
                if is_key_pressed(KeyCode::Escape) || is_key_pressed(KeyCode::P) {
                    world.phase = Phase::Playing;
                }
                if is_key_pressed(KeyCode::Q) {
                    world.phase = Phase::Start;
                }
            }
            Phase::Upgrade => {
                // Number keys 1-3 pick an upgrade
                for (i, key) in [KeyCode::Key1, KeyCode::Key2, KeyCode::Key3].iter().enumerate() {
                    if is_key_pressed(*key) {
                        if let Some(upgrade_key) = world.upgrade_choices.get(i) {
                            let uk = upgrade_key.clone();
                            apply_upgrade(&mut world.player, &uk);
                            world.phase = Phase::Playing;
                            world.wave += 1;
                            spawn_wave(&mut world, screen_w, screen_h);
                            break;
                        }
                    }
                }
            }
            Phase::GameOver => {
                if is_key_pressed(KeyCode::R) {
                    world.phase = Phase::Start;
                }
            }
        }

        render(&world, &input);
        next_frame().await
    }
}

// ── Helpers that mirror startGame() / startTutorialMode() ───────────────────
fn start_new_game(world: &mut GameWorld, difficulty: &str, sw: f32, sh: f32) {
    world.difficulty_key = difficulty.to_string();
    world.phase          = Phase::Playing;
    world.player.upgrades.clear();
    init_game(world, sw, sh);
    audio::play_music();
}

fn start_tutorial(world: &mut GameWorld, sw: f32, sh: f32) {
    world.difficulty_key = "tutorial".to_string();
    world.phase          = Phase::Tutorial;
    world.tutorial       = TutorialState::new();
    world.player.upgrades.clear();
    init_game(world, sw, sh);
    audio::play_music();
}

fn try_dash(world: &mut GameWorld) {
    let p = &mut world.player;
    if p.dash_energy >= 50.0 && !p.is_dashing {
        p.is_dashing   = true;
        p.dash_energy -= 50.0;
        p.dash_cooldown= p.max_dash_cooldown;
        p.dash_timer   = p.dash_duration;
        audio::play("dash");
        // Spawn blue dash particles
        for _ in 0..20 {
            world.particles.push(Particle::new(p.pos, BLUE));
        }
    }
}

// macroquad window config (title, size, resizable)
fn conf() -> macroquad::window::Conf {
    macroquad::window::Conf {
        window_title:   "Vampire Siege".to_string(),
        window_width:   800,
        window_height:  600,
        high_dpi:       true,  // important for mobile retina screens
        fullscreen:     false,
        platform: miniquad::conf::Platform::default(),
        ..Default::default()
    }
}