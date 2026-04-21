// ═══════════════════════════════════════════════════════════════════════════
//  input/mod.rs
//  Collects keyboard / mouse / touch into a clean InputState struct,
//  mirroring the scattered event listeners in useGameLoop.js.
//
//  Key difference: macroquad gives us is_key_down() / mouse_position() as
//  poll functions — no addEventListener needed.
// ═══════════════════════════════════════════════════════════════════════════

use macroquad::prelude::*;

#[derive(Default)]
pub struct InputState {
    /// Normalised movement vector (WASD / arrows / joystick) — same as moveX/moveY in JS
    pub move_x:     f32,
    pub move_y:     f32,
    /// Current aim position in screen space (mouse cursor / touch point)
    pub aim_pos:    Vec2,
    /// Whether the fire button is held (mouse down or mobileFireActive)
    pub fire_held:  bool,
    /// True on the frame the dash key was pressed
    pub dash_pressed: bool,
}

impl InputState {
    /// Call once per frame in the main loop.
    pub fn update(&mut self, player_pos: &Vec2) {
        // ── Movement ────────────────────────────────────────────────────
        // Mirrors: keys['d'] || keys['D'] || keys['arrowright'] etc.
        let right = is_key_down(KeyCode::D) || is_key_down(KeyCode::Right);
        let left  = is_key_down(KeyCode::A) || is_key_down(KeyCode::Left);
        let down  = is_key_down(KeyCode::S) || is_key_down(KeyCode::Down);
        let up    = is_key_down(KeyCode::W) || is_key_down(KeyCode::Up);

        self.move_x = (right as i8 - left as i8) as f32;
        self.move_y = (down  as i8 - up   as i8) as f32;

        // ── Aim ─────────────────────────────────────────────────────────
        let (mx, my) = mouse_position();
        self.aim_pos = vec2(mx, my);

        // Touch aim — use first touch point if present
        // macroquad exposes touches() on mobile / web
        let touches = touches();
        if !touches.is_empty() {
            // Map touch to aim (mirrors handleTouchMove)
            self.aim_pos = vec2(touches[0].position.x, touches[0].position.y);
        }

        // ── Fire ────────────────────────────────────────────────────────
        self.fire_held = is_mouse_button_down(MouseButton::Left)
            || (!touches.is_empty() && touches[0].phase != TouchPhase::Ended);

        // ── Dash ────────────────────────────────────────────────────────
        self.dash_pressed = is_key_pressed(KeyCode::Space);
    }

    /// Returns a (possibly non-normalised) movement Vec2.
    /// Normalisation happens in main.rs before applying speed.
    pub fn move_dir(&self) -> Vec2 {
        vec2(self.move_x, self.move_y)
    }
}