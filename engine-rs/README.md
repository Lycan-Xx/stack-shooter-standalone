# vampire_engine — Rust/WASM Simulation Core

The headless simulation engine for **Vampire Siege**. Compiles to a small
WebAssembly module that the React frontend drives every frame. This crate
owns physics, AI, collisions, particles, blood, and floating text. It does
*not* do rendering, audio, input, or menus — those stay in React.

> See [`docs/RUST_PORT_EXPLAINED.md`](../docs/RUST_PORT_EXPLAINED.md) for the
> high-level architecture and how this crate fits into the React app.

---

## Prerequisites

You need three things on your `PATH`:

1. **Rust (via rustup)** — the Nix-provided Rust does not have the
   `wasm32-unknown-unknown` target, so use rustup.
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
   . "$HOME/.cargo/env"
   rustup target add wasm32-unknown-unknown
   ```
   On Replit the rustup install lives at
   `/home/runner/workspace/.local/share/.cargo/`, so before any cargo command:
   ```bash
   . "/home/runner/workspace/.local/share/.cargo/env"
   ```

2. **`wasm-pack`** — drives the build and runs `wasm-bindgen` for us.
   The fastest way (cargo install can time out) is the prebuilt binary:
   ```bash
   curl -sL https://github.com/rustwasm/wasm-pack/releases/download/v0.13.1/wasm-pack-v0.13.1-x86_64-unknown-linux-musl.tar.gz \
     | tar -xz -C /tmp
   mv /tmp/wasm-pack-v0.13.1-x86_64-unknown-linux-musl/wasm-pack \
      "$HOME/.cargo/bin/wasm-pack"
   wasm-pack --version   # → wasm-pack 0.13.1
   ```

3. **Node + npm** — already configured for the React side.

---

## Building

From the **repo root**, run:

```bash
. "/home/runner/workspace/.local/share/.cargo/env"
cd engine-rs
wasm-pack build --release --target web --out-dir ../src/engine/pkg
```

This produces:

```
src/engine/pkg/
├── vampire_engine.js          # JS glue (imported by useGameLoop.js)
├── vampire_engine.d.ts        # TypeScript types
├── vampire_engine_bg.wasm     # the compiled engine (~73 KB)
├── vampire_engine_bg.wasm.d.ts
└── package.json
```

Vite picks the wasm up automatically on the next dev reload — no extra
config needed.

### Quick rebuild loop

```bash
. "/home/runner/workspace/.local/share/.cargo/env" \
  && (cd engine-rs && wasm-pack build --release --target web --out-dir ../src/engine/pkg)
```

---

## Project layout

```
engine-rs/
├── Cargo.toml      # crate config — cdylib + wasm-bindgen + glam
├── src/
│   └── lib.rs      # entire engine: Engine, Player, Enemy, particles, hitscan…
└── README.md       # you are here
```

Everything is in a single `lib.rs` on purpose: the engine is small (~600
lines) and easy to read top-to-bottom. Split it up only once it grows past
that.

---

## The public API (what JS calls)

All of the following are wired through `wasm-bindgen`:

| Method | Purpose |
| --- | --- |
| `new Engine()` | Construct the world. |
| `set_canvas_size(w, h)` | Tell the engine the play-area dimensions. |
| `reset_world()` | Clear enemies/particles, re-center the player. |
| `set_player_stats(maxHp, speed, dashCdMs, fireRateMs, dmg, piercing)` | Apply difficulty + upgrade stats. |
| `add_max_health(newMax, heal)` / `heal_full()` | Vitality upgrade & wave heal. |
| `try_dash()` / `end_dash()` | Dash control. |
| `spawn_vampire(x, y, hp, spd, dmg, score)` | Wave spawning (called from JS). |
| `spawn_boss(x, y, hp, spd, dmg, score)` | Boss waves. |
| `step(dt, mvX, mvY, mouseX, mouseY)` | **The hot path.** Runs all sim, returns `StepEvents { bits, damage_taken, shake }`. |
| `fire_hitscan()` | Try to fire. Returns `u32::MAX` if on cooldown, else number of hits. |
| `hit_x/y/angle/killed/score(i)` | Read back per-hit info after `fire_hitscan`. |
| `build_render_buffers()` | Pack live entities into flat `f32` buffers. |
| `enemies_ptr/len`, `particles_ptr/len`, `blood_ptr/len`, `enemy_stride`, `particle_stride` | Zero-copy buffer access for the renderer. |
| `texts_count`, `text_x/y/alpha/str/color(i)` | Floating-text readout. |
| `add_floating_text(x, y, text, color)` | "Wave Complete!" etc. |

Event bit flags returned by `step()`:

```
EV_PLAYER_HURT = 1 << 0
EV_GAME_OVER   = 1 << 1
```

---

## Buffer strides (must match `useGameLoop.js`)

If you change these in `lib.rs`, change them on the JS side too.

| Buffer | Stride (f32 per item) | Layout |
| --- | --- | --- |
| `enemies` | **9** | `x, y, radius, size, hp, max_hp, kind(0=vamp,1=boss), facing_left, is_charging` |
| `particles` | **7** | `x, y, radius, alpha, r, g, b` (colors 0–1) |
| `blood` | **4** | `x, y, radius, alpha` |

---

## Dependencies

- [`wasm-bindgen`](https://crates.io/crates/wasm-bindgen) — JS ↔ Rust bridge.
- [`glam`](https://crates.io/crates/glam) — small, fast `Vec2` math.

That's it. The crate intentionally avoids `rand` / `getrandom` (a custom
xorshift32 PRNG is included) so it builds cleanly for `wasm32-unknown-unknown`
without extra feature flags.

---

## Common gotchas

- **`error[E0463]: can't find crate for 'core'` when building** — the
  rustup environment isn't sourced. Run
  `. "/home/runner/workspace/.local/share/.cargo/env"` first.
- **`linker 'rust-lld' not found`** — the wasm32 target isn't installed.
  `rustup target add wasm32-unknown-unknown`.
- **Browser shows old code after rebuild** — Vite hot-reloads the JS glue
  but the browser may cache the `.wasm`. A hard refresh fixes it.
- **`cargo install wasm-pack` hangs / times out** — use the prebuilt
  binary in the Prerequisites section instead.

---

## Release profile

`Cargo.toml` is tuned for small, fast WASM:

```toml
[profile.release]
opt-level = 3
lto = true
codegen-units = 1
```

`wasm-pack` then runs `wasm-opt` on top, producing the ~73 KB final binary.
