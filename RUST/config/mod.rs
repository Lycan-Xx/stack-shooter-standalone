// ═══════════════════════════════════════════════════════════════════════════
//  config/mod.rs
//  Mirrors difficulty.js and upgrades.js combined.
//
//  JS → Rust:
//    export const DIFFICULTY = { easy: {...}, normal: {...} }
//    → a HashMap<String, DifficultyConfig> built at startup
//
//  Why a HashMap and not a match statement?
//  So the "challenge" system can override difficulty at runtime using
//  the same string keys your JS already uses.
// ═══════════════════════════════════════════════════════════════════════════

pub mod upgrades;

use std::collections::HashMap;

// One row of difficulty.js
#[derive(Debug, Clone)]
pub struct DifficultyConfig {
    pub player_health:    f32,
    pub player_speed:     f32,
    pub player_damage:    f32,
    pub enemy_health:     f32,
    pub enemy_speed:      f32,
    pub enemy_damage:     f32,
    pub enemies_per_wave: u32,
    pub fire_rate:        f32,   // seconds between shots (JS used ms)
    pub dash_cooldown:    f32,   // seconds
    pub score_multiplier: f32,
}

/// Build the difficulty table.  Call once at startup; store in a `lazy_static`
/// or just pass a reference around — it never changes.
pub fn build_difficulties() -> HashMap<String, DifficultyConfig> {
    let mut m = HashMap::new();

    m.insert("tutorial".into(), DifficultyConfig {
        player_health:    200.0,
        player_speed:     6.0,
        player_damage:    100.0,
        enemy_health:     50.0,
        enemy_speed:      0.5,
        enemy_damage:     5.0,
        enemies_per_wave: 2,
        fire_rate:        0.2,
        dash_cooldown:    2.0,
        score_multiplier: 0.0,
    });

    m.insert("easy".into(), DifficultyConfig {
        player_health:    150.0,
        player_speed:     6.0,
        player_damage:    75.0,
        enemy_health:     75.0,
        enemy_speed:      0.8,
        enemy_damage:     10.0,
        enemies_per_wave: 3,
        fire_rate:        0.25,
        dash_cooldown:    3.0,
        score_multiplier: 1.0,
    });

    m.insert("normal".into(), DifficultyConfig {
        player_health:    100.0,
        player_speed:     5.0,
        player_damage:    50.0,
        enemy_health:     100.0,
        enemy_speed:      1.0,
        enemy_damage:     15.0,
        enemies_per_wave: 5,
        fire_rate:        0.3,
        dash_cooldown:    4.0,
        score_multiplier: 2.0,
    });

    m.insert("hard".into(), DifficultyConfig {
        player_health:    75.0,
        player_speed:     5.0,
        player_damage:    40.0,
        enemy_health:     150.0,
        enemy_speed:      1.2,
        enemy_damage:     20.0,
        enemies_per_wave: 7,
        fire_rate:        0.35,
        dash_cooldown:    5.0,
        score_multiplier: 5.0,
    });

    m.insert("nightmare".into(), DifficultyConfig {
        player_health:    50.0,
        player_speed:     4.5,
        player_damage:    35.0,
        enemy_health:     200.0,
        enemy_speed:      1.5,
        enemy_damage:     30.0,
        enemies_per_wave: 10,
        fire_rate:        0.4,
        dash_cooldown:    6.0,
        score_multiplier: 10.0,
    });

    m
}

// Global difficulties map — built once, read everywhere.
// (In a bigger game you'd use lazy_static! or std::sync::OnceLock)
use std::sync::OnceLock;
static DIFF_TABLE: OnceLock<HashMap<String, DifficultyConfig>> = OnceLock::new();

pub fn init_difficulties() {
    DIFF_TABLE.get_or_init(build_difficulties);
}

pub fn get_difficulty(key: &str) -> &'static DifficultyConfig {
    DIFF_TABLE
        .get()
        .expect("call init_difficulties() first")
        .get(key)
        .unwrap_or_else(|| DIFF_TABLE.get().unwrap().get("normal").unwrap())
}

// Re-export as DIFFICULTIES for easy access from main.rs
pub struct DifficultiesTable;
impl std::ops::Index<&str> for DifficultiesTable {
    type Output = DifficultyConfig;
    fn index(&self, key: &str) -> &DifficultyConfig { get_difficulty(key) }
}
impl DifficultiesTable {
    pub fn get(&self, key: &str) -> Option<&'static DifficultyConfig> {
        DIFF_TABLE.get().and_then(|m| m.get(key))
    }
}
pub const DIFFICULTIES: DifficultiesTable = DifficultiesTable;

// Upgrade key type — mirrors the keys of the UPGRADES object in upgrades.js
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum UpgradeKey {
    MaxHealth,
    Damage,
    FireRate,
    Speed,
    DashCooldown,
    Piercing,
}

impl UpgradeKey {
    pub fn display_name(&self) -> &'static str {
        match self {
            UpgradeKey::MaxHealth    => "❤️  Vitality",
            UpgradeKey::Damage       => "💥 Firepower",
            UpgradeKey::FireRate     => "⚡ Rapid Fire",
            UpgradeKey::Speed        => "🏃 Agility",
            UpgradeKey::DashCooldown => "💨 Quick Dash",
            UpgradeKey::Piercing     => "🎯 Piercing Shots",
        }
    }
    pub fn description(&self) -> &'static str {
        match self {
            UpgradeKey::MaxHealth    => "Increase max health",
            UpgradeKey::Damage       => "Increase bullet damage",
            UpgradeKey::FireRate     => "Shoot faster",
            UpgradeKey::Speed        => "Move faster",
            UpgradeKey::DashCooldown => "Reduce dash cooldown",
            UpgradeKey::Piercing     => "Bullets pierce enemies",
        }
    }
    pub fn max_level(&self) -> u32 {
        match self { UpgradeKey::Piercing => 3, _ => 5 }
    }
}