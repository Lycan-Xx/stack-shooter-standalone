// ═══════════════════════════════════════════════════════════════════════════
//  hud/mod.rs
//  Replaces HUD.jsx, StartScreen.jsx, UpgradeScreen.jsx, GameOver.jsx,
//  TutorialOverlay.jsx and PauseMenu.jsx.
//
//  macroquad draws UI directly onto the canvas — no React needed.
//  All measurements are in screen-space pixels.
// ═══════════════════════════════════════════════════════════════════════════

use macroquad::prelude::*;
use crate::config::UpgradeKey;
use crate::tutorial::TutorialState;

const PANEL: Color   = Color { r: 0.04, g: 0.0, b: 0.08, a: 0.85 };
const BORDER: Color  = Color { r: 0.7,  g: 0.0, b: 0.0,  a: 1.0  };
const TEXT_W: Color  = WHITE;
const TEXT_Y: Color  = YELLOW;
const TEXT_G: Color  = GREEN;

fn panel(x: f32, y: f32, w: f32, h: f32) {
    draw_rectangle(x, y, w, h, PANEL);
    draw_rectangle_lines(x, y, w, h, 2.0, BORDER);
}

fn centered_text(text: &str, cy: f32, size: f32, color: Color) {
    let sw = screen_width();
    let tw = measure_text(text, None, size as u16, 1.0).width;
    draw_text(text, sw / 2.0 - tw / 2.0, cy, size, color);
}

// ── HUD (in-game overlay) ─────────────────────────────────────────────────────
pub fn draw_hud(
    health: f32, max_health: f32,
    wave: u32, kills: u32, score: u32,
    dash_energy: f32, max_dash_energy: f32,
    difficulty: &str,
) {
    let sw = screen_width();
    let sh = screen_height();

    // Health bar — top left
    let bw = 200.0; let bh = 18.0; let bx = 10.0; let by = 10.0;
    draw_rectangle(bx, by, bw, bh, Color::from_hex(0x320000));
    draw_rectangle(bx, by, bw * (health / max_health).max(0.0), bh, RED);
    draw_rectangle_lines(bx, by, bw, bh, 1.5, BLACK);
    draw_text(&format!("HP  {:.0}/{:.0}", health, max_health), bx + 4.0, by + 13.0, 14.0, WHITE);

    // Dash energy bar — top left below health
    let dy = by + bh + 6.0;
    draw_rectangle(bx, dy, bw, 12.0, Color::from_hex(0x001a3a));
    draw_rectangle(bx, dy, bw * (dash_energy / max_dash_energy).max(0.0), 12.0, Color::from_hex(0x00aaff));
    draw_rectangle_lines(bx, dy, bw, 12.0, 1.0, BLACK);
    draw_text("DASH", bx + 4.0, dy + 10.0, 11.0, WHITE);

    // Wave / kills / score — top right
    let rx = sw - 160.0;
    draw_text(&format!("Wave   {}", wave),  rx, 20.0, 16.0, YELLOW);
    draw_text(&format!("Kills  {}", kills), rx, 38.0, 16.0, WHITE);
    draw_text(&format!("Score  {}", score), rx, 56.0, 16.0, GREEN);

    // Difficulty badge — top centre
    let badge = match difficulty {
        "easy"      => "😊 EASY MODE",
        "hard"      => "😰 HARD MODE",
        "nightmare" => "💀 NIGHTMARE MODE",
        "tutorial"  => "📚 TUTORIAL",
        _           => "😐 NORMAL MODE",
    };
    let blen = measure_text(badge, None, 14, 1.0).width;
    draw_rectangle(sw / 2.0 - blen / 2.0 - 6.0, 5.0, blen + 12.0, 20.0, PANEL);
    draw_text(badge, sw / 2.0 - blen / 2.0, 19.0, 14.0, YELLOW);
}

// ── Start screen ─────────────────────────────────────────────────────────────
pub fn draw_start_screen() {
    let sw = screen_width();
    let sh = screen_height();

    // Dark overlay
    draw_rectangle(0.0, 0.0, sw, sh, Color { r: 0.05, g: 0.0, b: 0.1, a: 1.0 });

    centered_text("🧛 VAMPIRE SIEGE 🧛", sh * 0.18, 48.0, Color::from_hex(0xff3333));
    centered_text("Survive endless waves of vampires", sh * 0.28, 22.0, WHITE);

    let cx = sw / 2.0;
    let bw = 260.0; let bh = 44.0;

    let buttons = [
        ("1 — Easy",      "😊", Color::from_hex(0x22aa44)),
        ("2 — Normal",    "😐", Color::from_hex(0x2255cc)),
        ("3 — Hard",      "😰", Color::from_hex(0xcc7700)),
        ("4 — Nightmare", "💀", Color::from_hex(0xaa0000)),
        ("T — Tutorial",  "📚", Color::from_hex(0x446688)),
    ];

    for (i, (label, icon, color)) in buttons.iter().enumerate() {
        let y = sh * 0.38 + i as f32 * 54.0;
        draw_rectangle(cx - bw / 2.0, y, bw, bh, *color);
        draw_rectangle_lines(cx - bw / 2.0, y, bw, bh, 2.0, WHITE);
        let tw = measure_text(label, None, 22, 1.0).width;
        draw_text(label, cx - tw / 2.0, y + 28.0, 22.0, WHITE);
    }

    centered_text("WASD / Arrows — Move    Mouse — Aim    Click — Shoot    Space — Dash",
        sh * 0.91, 14.0, Color { r: 0.7, g: 0.7, b: 0.7, a: 1.0 });
}

// ── Upgrade screen ────────────────────────────────────────────────────────────
pub fn draw_upgrade_screen(choices: &[UpgradeKey]) {
    let sw = screen_width();
    let sh = screen_height();
    draw_rectangle(0.0, 0.0, sw, sh, Color { r: 0.0, g: 0.0, b: 0.0, a: 0.75 });

    centered_text("⬆  CHOOSE AN UPGRADE  ⬆", sh * 0.15, 36.0, YELLOW);
    centered_text("Press 1 / 2 / 3", sh * 0.22, 18.0, WHITE);

    let cw = 220.0; let ch = 120.0;
    let gap = 20.0;
    let total = choices.len() as f32 * cw + (choices.len().saturating_sub(1)) as f32 * gap;
    let start_x = (sw - total) / 2.0;

    for (i, key) in choices.iter().enumerate() {
        let x = start_x + i as f32 * (cw + gap);
        let y = sh * 0.35;
        panel(x, y, cw, ch);
        draw_text(&format!("{}", i + 1), x + 10.0, y + 20.0, 18.0, YELLOW);
        draw_text(key.display_name(), x + 10.0, y + 46.0, 18.0, WHITE);
        // Word-wrap description (simple single line for now)
        draw_text(key.description(), x + 10.0, y + 70.0, 14.0, Color::from_hex(0xbbbbbb));
    }
}

// ── Game over screen ──────────────────────────────────────────────────────────
pub fn draw_game_over(wave: u32, kills: u32, score: u32, difficulty: &str) {
    let sw = screen_width();
    let sh = screen_height();
    draw_rectangle(0.0, 0.0, sw, sh, Color { r: 0.0, g: 0.0, b: 0.0, a: 0.85 });

    centered_text("💀 GAME OVER 💀",       sh * 0.25, 52.0, RED);
    centered_text(&format!("Wave  {}", wave),  sh * 0.40, 28.0, WHITE);
    centered_text(&format!("Kills {}", kills), sh * 0.47, 28.0, WHITE);
    centered_text(&format!("Score {}", score), sh * 0.54, 28.0, YELLOW);

    let diff_label = match difficulty {
        "easy"      => "😊 Easy",
        "hard"      => "😰 Hard",
        "nightmare" => "💀 Nightmare",
        _           => "😐 Normal",
    };
    centered_text(diff_label, sh * 0.61, 22.0, Color::from_hex(0xaaaaaa));
    centered_text("Press R to return to main menu", sh * 0.75, 20.0, WHITE);
}

// ── Pause menu ────────────────────────────────────────────────────────────────
pub fn draw_pause_menu() {
    let sw = screen_width();
    let sh = screen_height();
    draw_rectangle(0.0, 0.0, sw, sh, Color { r: 0.0, g: 0.0, b: 0.0, a: 0.6 });
    centered_text("⏸  PAUSED",                    sh * 0.35, 42.0, WHITE);
    centered_text("Esc / P — Resume",              sh * 0.50, 22.0, WHITE);
    centered_text("Q       — Quit to Main Menu",   sh * 0.57, 22.0, WHITE);
}

// ── Tutorial overlay ──────────────────────────────────────────────────────────
pub fn draw_tutorial_overlay(t: &TutorialState) {
    if !t.visible { return; }
    let sw = screen_width();
    let sh = screen_height();
    let pw = 500.0; let ph = 140.0;
    let px = (sw - pw) / 2.0; let py = sh * 0.65;

    panel(px, py, pw, ph);
    // Split text on \n and draw line by line
    for (i, line) in t.current_text().split('\n').enumerate() {
        draw_text(line, px + 16.0, py + 26.0 + i as f32 * 22.0, 17.0, WHITE);
    }
    let hint = "[ Enter / Space / Tap ] Continue";
    let hw = measure_text(hint, None, 13, 1.0).width;
    draw_text(hint, px + pw / 2.0 - hw / 2.0, py + ph - 10.0, 13.0,
        Color { r: 0.6, g: 0.6, b: 0.6, a: 1.0 });
}