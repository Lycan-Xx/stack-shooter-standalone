# 🧛 Stack Shooter: Vampire Siege (Standalone)

A top-down, wave-survival shooter in the Vampire-Survivors mould — dash through
swarms, chain upgrades, take down escalating bosses. This is the **standalone,
cross-platform rebuild** of the game, decoupled from Reddit's Devvit platform,
with its core simulation running in a compiled Rust/WebAssembly engine.

> Originally built as a Reddit-native game for the Reddit x Kiro Hackathon 2025
> (see [`stack-shooter-reddit`](https://github.com/Lycan-Xx/stack-shooter-reddit)
> for that version — it won an honorable mention). This repo is the ongoing
> rebuild: no Reddit dependency, playable anywhere on the open web, with an
> Android build in progress.

---

## 🎮 Gameplay

- **4 difficulty modes** — Easy, Normal, Hard, Nightmare
- **6 upgrade paths** — Vitality, Firepower, Rapid Fire, Agility, Quick Dash, Piercing Shots
- **Boss waves** — multi-phase bosses with distinct abilities on top of the standard vampire waves
- **Dash mechanic** — energy-managed dash for crowd control and repositioning
- **Procedural visuals** — characters and effects are drawn procedurally (SVG-style), no external art assets to load
- **Tutorial mode** — interactive onboarding for new players
- **Mobile-first controls** — virtual joystick + tap-to-fire, alongside WASD/mouse on desktop

### Controls
| Platform | Move | Aim / Fire | Dash |
|---|---|---|---|
| Desktop | WASD / Arrows | Mouse to aim, click to shoot | Spacebar |
| Mobile | Virtual joystick | Tap to fire | Dash button |

---

## 🏗️ Architecture

The interesting part of this rebuild is the split between the game shell and
the simulation:

```
┌─────────────────────── React (JS) ───────────────────────┐
│  Menus · HUD · Audio · Input · Wave scheduling            │
│  Upgrades · Tutorial · Canvas 2D drawing                   │
│                                                             │
│        ▲                                    │              │
│        │ read world (zero-copy)              │ step(dt, input) │
│        │                                      ▼              │
│  ┌───────────────── Rust (compiled to WASM) ─────────────┐ │
│  │  Player · Enemies · Boss AI · Collisions · Hitscan     │ │
│  │  Particles · Blood splatters · Floating text           │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

React owns everything the player sees and touches — menus, HUD, sound,
input, wave timing, the tutorial state machine. The Rust engine
(`engine-rs/`) is a small headless library that owns only the hot-loop
math: player/enemy state, boss AI, collision and hitscan resolution, and
particle systems. React calls into it ~60 times a second and reads the
results back out of WASM memory with no copying.

Full write-up of why this split (and not a full Rust/macroquad port) is
the right call: [`docs/RUST_PORT_EXPLAINED.md`](docs/RUST_PORT_EXPLAINED.md).

Project history and phase-by-phase evolution: [`CHANGELOG.md`](CHANGELOG.md).

---

## 🛠️ Tech Stack

- **[React 19](https://react.dev/)** + **[Vite 6](https://vite.dev/)** — UI and build tooling
- **[Rust](https://www.rust-lang.org/)** + **[wasm-bindgen](https://rustwasm.github.io/wasm-bindgen/)** + **[glam](https://docs.rs/glam)** — compiled simulation engine (`engine-rs/`)
- **[Tailwind CSS 4](https://tailwindcss.com/)** — styling
- **[Capacitor](https://capacitorjs.com/)** — native Android wrapper
- **[Vercel](https://vercel.com/)** — web hosting + analytics
- **GitHub Actions** — automated WASM recompilation and Android APK builds

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Rust + `wasm-pack` (only if you're changing the engine itself — prebuilt WASM output is committed to `src/engine/pkg/`)
- Android SDK + JDK 21 (only if building the Android app locally)

### Installation

```bash
git clone https://github.com/Lycan-Xx/stack-shooter-standalone.git
cd stack-shooter-standalone
npm install
```

### Run the web app

```bash
npm run dev       # local dev server
npm run build      # production build to dist/
npm run preview    # preview the production build
```

### Rebuild the Rust engine

The compiled WASM output is committed to the repo, so you don't need Rust
installed just to run the game. If you change `engine-rs/src/lib.rs`:

```bash
cd engine-rs
wasm-pack build --target web --release
cp -r pkg/. ../src/engine/pkg/
```

Pushing changes under `engine-rs/` to `main` also triggers a GitHub Action
that does this automatically and commits the result.

### Build the Android app

```bash
npm run build:android   # vite build + capacitor sync
cd android
./gradlew assembleDebug
```

Pushing to `main` also triggers a GitHub Action that produces a debug APK
as a build artifact.

---

## 📁 Project Structure

```
stack-shooter-standalone/
├── engine-rs/              # Rust simulation engine (compiled to WASM)
│   └── src/lib.rs
├── src/
│   ├── engine/
│   │   ├── core/            # useGameLoop.js — drives the WASM engine each frame
│   │   ├── logic/            # difficulty, tutorial, upgrade rules (JS)
│   │   ├── systems/          # procedural rendering, sound
│   │   └── pkg/              # compiled WASM output + JS bindings
│   ├── components/          # React UI: StartScreen, HUD, GameOver, UpgradeScreen, etc.
│   └── shared/               # shared types
├── android/                  # Capacitor Android project
└── docs/
    ├── RUST_PORT_EXPLAINED.md
    └── development/
```

---

## 🗺️ Roadmap

- [x] Standalone web build, fully playable, no external dependencies
- [x] Rust/WASM simulation engine (player, enemies, bosses, collisions, particles)
- [x] Android build via Capacitor + GitHub Actions
- [ ] Signed release build for Google Play
- [ ] iOS build (requires macOS/Xcode toolchain)
- [ ] ECS-based engine architecture, `wgpu` rendering, parallel physics with Rayon (longer-term performance target)

See [`CHANGELOG.md`](CHANGELOG.md) for the full phase-by-phase history.

---

## 📝 License

BSD-3-Clause — see [LICENSE](LICENSE).

## 🔗 Links

- **This repo**: https://github.com/Lycan-Xx/stack-shooter-standalone
- **Original Reddit/Devvit version**: https://github.com/Lycan-Xx/stack-shooter-reddit
- **GitHub**: [@Lycan-Xx](https://github.com/Lycan-Xx)
