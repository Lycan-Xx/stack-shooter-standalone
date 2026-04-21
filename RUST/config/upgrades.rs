// ═══════════════════════════════════════════════════════════════════════════
//  config/upgrades.rs
//  Direct port of upgrades.js
//
//  JS → Rust key differences:
//    • The JS `effect` was a closure mutating `player` at call time.
//      In Rust we use a plain function `apply_upgrade(player, key)`.
//    • `getRandomUpgrades` used Array.sort(() => Math.random() - 0.5)
//      — a Fisher-Yates style shuffle.  Here we use rand::seq::SliceRandom.
// ═══════════════════════════════════════════════════════════════════════════

use std::collections::HashMap;
use rand::seq::SliceRandom;
use crate::config::UpgradeKey;
use crate::entities::Player;

pub const UPGRADES: &[UpgradeKey] = &[
    UpgradeKey::MaxHealth,
    UpgradeKey::Damage,
    UpgradeKey::FireRate,
    UpgradeKey::Speed,
    UpgradeKey::DashCooldown,
    UpgradeKey::Piercing,
];

/// Mirrors getRandomUpgrades(playerUpgrades, count)
/// Returns up to `count` upgrades that haven't hit max level yet, in random order.
pub fn random_upgrades(
    current_levels: &HashMap<UpgradeKey, u32>,
    count: usize,
) -> Vec<UpgradeKey> {
    let mut available: Vec<UpgradeKey> = UPGRADES
        .iter()
        .filter(|k| {
            let level = current_levels.get(k).copied().unwrap_or(0);
            level < k.max_level()
        })
        .cloned()
        .collect();

    available.shuffle(&mut rand::thread_rng());
    available.truncate(count);
    available
}

/// Mirrors applyUpgrade(player, playerUpgrades, upgradeKey)
/// Modifies player stats directly based on upgrade key and new level.
pub fn apply_upgrade(player: &mut Player, key: &UpgradeKey) {
    let current = player.upgrades.get(key).copied().unwrap_or(0);
    if current >= key.max_level() { return; }

    let new_level = current + 1;
    player.upgrades.insert(key.clone(), new_level);
    let lvl = new_level as f32;

    match key {
        UpgradeKey::MaxHealth => {
            // JS: player.maxHealth = 100 + level * 20
            //     player.health = Math.min(player.health + 20, player.maxHealth)
            player.max_health = 100.0 + lvl * 20.0;
            player.health = (player.health + 20.0).min(player.max_health);
        }
        UpgradeKey::Damage => {
            // JS: player.weapon.damage = 50 + level * 15
            player.weapon.damage = 50.0 + lvl * 15.0;
        }
        UpgradeKey::FireRate => {
            // JS: player.weapon.fireRate = Math.max(100, 300 - level * 40)  (ms)
            // We store fire_rate in seconds so: max(0.1, 0.3 - level * 0.04)
            player.weapon.fire_rate = (0.3 - lvl * 0.04).max(0.1);
        }
        UpgradeKey::Speed => {
            // JS: player.speed = 5 + level * 0.5
            player.speed = 5.0 + lvl * 0.5;
        }
        UpgradeKey::DashCooldown => {
            // JS: player.maxDashCooldown = Math.max(1500, 4000 - level * 500) (ms)
            // In seconds: max(1.5, 4.0 - level * 0.5)
            player.max_dash_cooldown = (4.0 - lvl * 0.5).max(1.5);
        }
        UpgradeKey::Piercing => {
            // JS: player.weapon.piercing = level
            player.weapon.piercing = new_level;
        }
    }
}