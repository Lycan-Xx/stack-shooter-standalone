# 🧛 Vampire Siege: Architectural Blueprint & Engineering Analysis

This document provides a detailed technical decomposition of the **Vampire Siege** project. It is designed to serve as a high-context foundation for an **AI-driven Rust rebuild** and as a technical reference for a **Senior Developer** to evaluate the project's architectural viability.

---

## 🏗️ Architectural Philosophy

The project follows a **Hybrid Reactive-Imperative** model. While the outer shell is built with **React 19**, the core gameplay is driven by a custom imperative engine to ensure 60FPS performance on both desktop and mobile.

### Key Pillars:
1.  **Engine/UI Decoupling**: The game logic (`src/engine`) is almost entirely agnostic of the React UI (`src/components`).
2.  **Performance-First State**: High-frequency data (entity positions, velocity) resides in **React Refs** (`useRef`), bypassing the React reconciliation overhead.
3.  **Procedural Rendering**: No heavy sprite-sheets. Visuals are procedurally drawn via Canvas API to ensure zero-latency asset loading and minimal bundle size.

---

## 📁 Directory Taxonomy

### 1. `src/engine/core/`
The "Brain" of the application.
- **`useGameLoop.js`**: The primary orchestrator. It manages the `requestAnimationFrame` loop, handles input mapping (Keyboard/Mouse/Joystick), and coordinates the lifecycle of all game entities.

### 2. `src/engine/entities/`
The "Actors" in the simulation. These are class-based objects managing their own internal state.
- **`entities.js`**: Houses the base classes for `Vampire` (ENEMIES), `Bullet` (PROJECTILES), and `Particle/BloodSplatter` (VFX).
- **`Boss.js`**: A specialized extension of the enemy system with multi-phase AI and unique ability timers.
- **Lifecycle**: `Spawn` -> `Update(delta)` -> `Draw(ctx)` -> `Cull(collision/cleanup)`.

### 3. `src/engine/logic/`
The "Ruleset" and balancing configurations.
- **`difficulty.js`**: Defines the power curve. Constants for health scaling, speed modifiers, and spawn rates per wave.
- **`upgrades.js`**: A declarative definition of the "Survivor" upgrade tree (Vitality, Firepower, Agility, etc.).
- **`tutorial.js`**: A state-machine driven guide for onboarding players.

### 4. `src/engine/systems/`
The "Services" used by the core and entities.
- **`svgCharacters.js`**: The procedural renderer. Instead of loading images, it provides functions to draw complex shapes (Player, Vampires) directly to the Canvas context.
- **`sound.js`**: A pooled audio manager for low-latency SFX and background music.
- **`visualEffects.js`**: Manages ephemeral visual data like damage numbers and hit markers.

---

## 🔄 Core Systems Analysis

### State Management Strategy
The engine utilizes a **"Single-Ref Source of Truth"**. 

> [!IMPORTANT]
> **Performance Optimization**: If we used `useState` for vampire coordinates, the React component tree would re-render 60 times per second, causing massive lag. Instead, all coordinates are updated in `useRef` objects, and `useState` is only triggered when the **HUD** needs to update (e.g., once every 10 frames or on health change).

### Collision & Update Loop
The loop in `useGameLoop.js` performs the following steps every frame:
1.  **Input Synthesis**: Convert raw KeyDown/Mouse events into direction vectors and fire-commands.
2.  **Physics Update**: Iterate through `bulletsRef` and `enemiesRef`.
3.  **Spatial Conflict Resolution**: Check collisions between bullets and enemies. This is currently a simple **Circle-vs-Circle** distance check.
4.  **Culling**: Remove "dead" objects to prevent memory leaks.
5.  **HUD Sync**: Push high-level data (Score, Wave, Health) to React state for UI rendering.

---

## 🦀 Rust Rebuild Bridge (Vite -> Rust/Wasm)

To facilitate a transition to Rust (e.g., using **Bevy**, **Macroquad**, or **Wasm-Bindgen**), apply the following mapping:

| Project Component | JS Implementation | Recommended Rust Pattern |
| :--- | :--- | :--- |
| **Entities** | `class Vampire`, `class Bullet` | **ECS (Entity Component System)**. Components: `Transform`, `Velocity`, `Health`. |
| **Game Loop** | `requestAnimationFrame` | **System Schedule**. `update_physics`, `handle_input`, `draw_frame`. |
| **Rendering** | `CanvasRenderingContext2D` | **Wgpu** or **Skia**. Rust-based procedural drawing or low-level WebGL. |
| **Logic** | JSON-like objects in `.js` files | **Serde-backed Configs**. TOML/JSON descriptors for upgrades and difficulty. |

---

## 🛠️ Developer Context for Senior Review

### Viability Assessment:
- **Modularity**: High. The `src/engine` is ready to be ported to a non-React environment if necessary.
- **Complexity**: Moderate. The most complex logic resides in the collision handling and the `Boss` AI state machine.
- **Bottlenecks**: In JS, the garbage collector can stutter if too many `BloodSplatter` particles are instantiated. A Rust rebuild should utilize **Object Pooling** or a stack-allocated ECS to eliminate this.

> [!TIP]
> **Scaling Potential**: The current architecture is designed for ~100 active entities. A Rust migration would allow for ~1,000+ entities using Rayon for parallel physics updates.

---

### Document Metadata
- **Status**: Verified Standalone (Reddit/Backend dependencies removed).
- **Target Version**: 2.0 (Native Multi-platform).
- **Core Dependencies**: React 19, Vite 6, Vercel Analytics.
