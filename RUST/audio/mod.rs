// ═══════════════════════════════════════════════════════════════════════════
//  audio/mod.rs  —  mirrors sound.js
//
//  macroquad has basic audio support via macroquad::audio.
//  Because the original sound.js was completely stubbed out (CSP issues
//  in Reddit), we start with the same stub pattern and provide a clear
//  upgrade path once you have audio files bundled.
//
//  HOW TO ADD REAL AUDIO:
//  1. Put .ogg or .wav files in  assets/sounds/
//  2. In main() call  audio::init().await  before the game loop
//  3. init() loads them with  macroquad::audio::load_sound()
//  4. play() looks up the Sound and calls  macroquad::audio::play_sound()
// ═══════════════════════════════════════════════════════════════════════════

use std::collections::HashMap;
use std::sync::OnceLock;

// In a real build, replace () with macroquad::audio::Sound
type SoundHandle = ();

static SOUNDS: OnceLock<HashMap<&'static str, SoundHandle>> = OnceLock::new();
static mut MUSIC_PLAYING: bool = false;

/// Load all sounds at startup (async because macroquad::audio::load_sound is async).
/// Call this once in main() before the loop: `audio::init().await;`
pub async fn init() {
    // Example when you have real assets:
    //
    // use macroquad::audio::{load_sound, play_sound, PlaySoundParams};
    // let mut map = HashMap::new();
    // map.insert("shoot",       load_sound("assets/sounds/shoot.ogg").await.unwrap());
    // map.insert("enemyHit",    load_sound("assets/sounds/hit.ogg").await.unwrap());
    // map.insert("enemyDeath",  load_sound("assets/sounds/death.ogg").await.unwrap());
    // map.insert("playerHurt",  load_sound("assets/sounds/hurt.ogg").await.unwrap());
    // map.insert("dash",        load_sound("assets/sounds/dash.ogg").await.unwrap());
    // map.insert("waveComplete",load_sound("assets/sounds/wave.ogg").await.unwrap());
    // map.insert("gameOver",    load_sound("assets/sounds/gameover.ogg").await.unwrap());
    // SOUNDS.set(map).ok();

    // Stub — no-op for now
    SOUNDS.set(HashMap::new()).ok();
}

/// Play a one-shot sound effect by key.
/// Mirrors soundManager.play(key) in sound.js.
pub fn play(_key: &str) {
    // Stub — replace with:
    // if let Some(sounds) = SOUNDS.get() {
    //     if let Some(sound) = sounds.get(key) {
    //         macroquad::audio::play_sound(sound, PlaySoundParams { looped: false, volume: 0.5 });
    //     }
    // }
}

pub fn play_music() {
    // Stub — load and loop a music track here
}

pub fn stop_music() {
    // Stub
}