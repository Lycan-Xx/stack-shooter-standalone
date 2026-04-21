# 🧛 Vampire Siege — Rust/macroquad Rebuild

Cross-platform survival shooter targeting **Web (WASM)**, **Android**, and **iOS**
from a single Rust codebase. Rebuilt from the original React + Canvas JS version.

---

## 🗂 File Map (JS → Rust)

| Old JS file | New Rust file | What it does |
|---|---|---|
| `useGameLoop.js` | `src/main.rs` | Game loop, update, draw, state machine |
| `entities.js` | `src/entities/mod.rs` | Vampire, Bullet, Particle, BloodSplatter |
| `Boss.js` | `src/entities/mod.rs` | BossVampire (as `EnemyKind::Boss` enum variant) |
| `difficulty.js` | `src/config/mod.rs` | Difficulty configs |
| `upgrades.js` | `src/config/upgrades.rs` | Upgrade tree + apply logic |
| `tutorial.js` | `src/tutorial/mod.rs` | Tutorial state machine |
| `svgCharacters.js` | `src/draw/mod.rs` | Procedural character rendering |
| `visualEffects.js` | `src/effects/mod.rs` | Hit markers, damage numbers, ricochets |
| `sound.js` | `src/audio/mod.rs` | Audio manager (stub, easy to fill in) |
| `Game.jsx` + HUD components | `src/hud/mod.rs` | All UI screens drawn on canvas |

---

## 🚀 Quick Start (Desktop)

### 1. Install Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# Restart your terminal, then:
rustc --version   # should print 1.77+
```

### 2. Run on Desktop
```bash
cd vampire_siege
cargo run
```
That's it. A window opens with the game running natively.

---

## 🌐 Build for Web (Vercel)

```bash
bash build_web.sh          # compiles to WASM, outputs to dist/
npx serve dist             # preview locally at http://localhost:3000
```

Then push to GitHub — Vercel picks up `vercel.json` and runs the build automatically.

> **Note**: Vercel's build containers have limited RAM. If the build times out,
> build locally and commit the `dist/` folder, then set `buildCommand` to `""` in vercel.json.

---

## 📱 Build for Android

```bash
# Install Android NDK (one time)
cargo install cargo-apk

# Add Android targets
rustup target add \
  aarch64-linux-android \
  armv7-linux-androideabi \
  x86_64-linux-android

# Build APK
cargo apk build --release
# APK is at target/release/apks/vampire_siege.apk
```

You need the Android NDK installed and `$ANDROID_NDK_HOME` set.
The [cargo-apk docs](https://github.com/rust-mobile/cargo-apk) have the full setup.

---

## 🍎 Build for iOS

```bash
# Requires macOS + Xcode
rustup target add aarch64-apple-ios

cargo build --release --target aarch64-apple-ios
# Then open the generated .xcodeproj or use cargo-xcode
```

See [macroquad's iOS guide](https://macroquad.rs/tutorials/ios/) for the Xcode project setup.

---

## 🎮 Controls

| Action | Desktop | Mobile |
|---|---|---|
| Move | WASD / Arrow keys | Virtual joystick (coming) |
| Aim | Mouse | Touch drag |
| Shoot | Left click (hold) | Tap |
| Dash | Space | Dash button (coming) |
| Pause | Esc | — |
| Restart | R (on game over) | — |

---

## 🔊 Adding Real Audio

1. Drop `.ogg` files into `assets/sounds/`
2. Open `src/audio/mod.rs`
3. Uncomment the `load_sound` calls in `init()` and the `play_sound` call in `play()`
4. Call `audio::init().await` near the top of `main()`

---

## 🏗 Architecture Notes

### Why macroquad?
- Single `.wasm` file for web — no Node.js, no bundler
- Same code compiles to Android + iOS via `cargo-apk` / Xcode
- Draw API (`draw_circle`, `draw_rectangle`, `draw_line`) maps 1-to-1
  with your existing Canvas 2D calls in `svgCharacters.js`

### Why no ECS yet?
The current architecture (plain `Vec<Enemy>`) matches the JS 1-to-1 and is
plenty fast for ~100 entities. When you want 1000+ enemies, swap `Vec<Enemy>`
for [hecs](https://crates.io/crates/hecs) or [bevy_ecs](https://crates.io/crates/bevy_ecs).

### Performance tip
The biggest GC pressure in the JS version was `BloodSplatter` allocation.
In Rust, `Vec<BloodSplatter>` is stack-managed and the `.retain_mut()` call
removes dead entries without allocation — zero GC pauses.