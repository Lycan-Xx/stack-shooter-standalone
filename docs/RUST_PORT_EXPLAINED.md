# Why the Rust Port Wasn't Working — and How We Fixed It

A plain-English walkthrough of what went wrong with the original Rust attempt,
why it didn't match what you were expecting, and how the new architecture
actually delivers on the goal.

---

## 1. What you originally asked for

> "Port the engine of my React game to Rust."

There are two completely different ways to read that, and the first attempt
took the wrong one.

| Interpretation | What it means in practice |
| --- | --- |
| **A. Port the whole game to Rust** | Throw away React. Rewrite everything (rendering, input, audio, menus) in Rust using a game framework like macroquad. Ship a single `.wasm` blob. |
| **B. Port only the engine to Rust** | Keep React for everything users see and touch. Move only the *simulation* (physics, AI, collisions) into Rust. React drives Rust each frame and draws the result. |

The first session went down path **A**. That's why you ended up with the
`RUST/` folder — a standalone macroquad app, completely separate from your
React code, served by a plain Python web server. It "ran," but it had nothing
to do with your real game.

What you actually wanted was path **B**: keep your React UI, your menus, your
audio, your tutorial — but make the per-frame number-crunching happen in
fast, compiled Rust.

---

## 2. Why the macroquad approach was a dead end for your project

The standalone Rust/macroquad version had three fatal problems for what you
were trying to achieve:

1. **It duplicated your game instead of accelerating it.** Every menu,
   every upgrade, every sound, every piece of HUD had to be re-implemented
   from scratch in Rust. Your React work was sitting unused.
2. **It couldn't talk to React.** macroquad takes over the entire `<canvas>`
   and runs its own loop. There's no clean way for your React components
   (`StartScreen.jsx`, `HUD.jsx`, `UpgradeScreen.jsx`, etc.) to read or
   change anything inside it.
3. **It broke your Devvit integration path.** Devvit expects a normal web
   page with normal DOM. macroquad's WebGL takeover doesn't play nicely
   with that.

You could see this directly in the browser: the page was just a black canvas
with WebGL errors, because macroquad was trying to grab a GL context that
wasn't available in the iframe.

---

## 3. The architecture that actually works

Instead of one giant Rust app, the engine is now a **small headless library**
that React calls into 60 times per second. Think of it as a calculator: React
hands it the current inputs, Rust returns the new world state, React draws it.

```
┌─────────────────────────── React (JS) ───────────────────────────┐
│                                                                  │
│   Menus · HUD · Audio · Input · Wave scheduling · Upgrades       │
│   Tutorial · Canvas 2D drawing · Devvit integration              │
│                                                                  │
│            ▲                                  │                  │
│            │ read world                       │ step(dt, input)  │
│            │ (zero-copy buffers)              ▼                  │
│   ┌──────────────────────── Rust (WASM) ──────────────────────┐  │
│   │   Player · Enemies · Boss AI · Collisions · Hitscan       │  │
│   │   Particles · Blood splatters · Floating text             │  │
│   └───────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Who owns what

| Concern | Lives in | Why |
| --- | --- | --- |
| Menus, HUD, upgrade screen, pause | **React** | Already built, looks good, easy to tweak. |
| Sound effects & music | **React** | Browser audio APIs live in JS. |
| Keyboard / mouse / touch input | **React** | DOM events are JS-native. |
| Wave timing & spawning | **React** | High-level game flow you'll keep iterating on. |
| Tutorial state machine | **React** | Tied to UI overlays. |
| Player & enemy positions | **Rust** | Hot-loop math, runs every frame. |
| Boss AI & charging | **Rust** | Branchy logic that benefits from compiled speed. |
| Collisions & hitscan | **Rust** | The real performance bottleneck. |
| Particles, blood, floating text | **Rust** | Lots of small objects, perfect for compiled code. |

This split means **everything you've already built keeps working.** Your
`StartScreen`, `HUD`, `GameOver`, `UpgradeScreen`, `TutorialOverlay`,
`Controls`, `MuteButton`, `PauseMenu`, `DifficultySelect`, `sound.js`, and
`svgCharacters.js` files are all still in charge of what they were doing
before. The hook in the middle (`useGameLoop.js`) is the only file that
changed substantially.

---

## 4. How the two sides actually talk

Crossing the JS ↔ WASM boundary is a bit expensive, so the API is designed to
keep that crossing rare and cheap.

### Each frame (60 times/sec):

1. React gathers input (WASD, mouse position, touch joystick).
2. React calls `engine.step(dt, moveX, moveY, mouseX, mouseY)`.
   Rust runs all the physics, AI, and collision in one go and returns a
   tiny event packet (player hurt? game over? screen shake amount?).
3. If the player is firing, React calls `engine.fire_hitscan()` once.
   Rust returns how many enemies were hit and React reads back the hit
   info to play the right sound and show ricochet sparks.
4. React calls `engine.build_render_buffers()`. Rust packs all live
   enemies, particles, and blood into flat number arrays.
5. React reads those arrays **directly out of WASM memory** (no copying)
   and draws them with the existing Canvas 2D code.

### When the wave changes:

- React decides "spawn 8 vampires for wave 3" and calls
  `engine.spawn_vampire(x, y, hp, speed, damage, score)` for each one.
- Rust just adds them to its enemy list.

### When the player picks an upgrade:

- React calculates the new stats from the upgrade tree.
- React calls `engine.set_player_stats(...)` once.
- Rust applies them.

That's the entire conversation. Everything else — graphics, sound, menus —
stays in JS where it belongs.

---

## 5. What you get from this split

- **Speed where it matters.** The per-frame loop (hundreds of enemies,
  particles, and collision checks) runs in compiled Rust. Menus and audio
  stay in JS where their performance doesn't matter.
- **Nothing you've built is wasted.** Every React component, every CSS
  file, every sound file keeps working as-is.
- **Devvit-friendly.** It's still just a normal React app from the
  outside. The Rust part is invisible to anything that isn't your game
  loop.
- **Easy to keep tuning.** Want to change wave timing or upgrade math?
  That's still plain JavaScript. Want to add a new enemy behavior?
  That's a small addition to the Rust file and one new bind.

---

## 6. Concretely, what changed in this session

- **New folder `engine-rs/`** — the Rust source for the engine library.
- **New folder `src/engine/pkg/`** — the compiled WebAssembly module and
  its auto-generated JavaScript bindings.
- **`src/engine/core/useGameLoop.js`** — rewritten to load the WASM
  engine on startup and drive it each frame, instead of running all the
  game logic in JS.
- **`vite.config.ts`** — set up to serve on port 5000 and accept the
  Replit preview iframe.
- **Workflow** — switched from "serve the standalone macroquad build"
  to "run the React dev server."

Your `RUST/` folder (the old macroquad attempt) is still on disk but is no
longer wired into anything. You can delete it whenever you want; it isn't
referenced by the React app or the build.

---

## 7. The short version

The first attempt rebuilt your game *as* a Rust program. What you wanted
was for your game to *use* a Rust engine. The new setup keeps React in
charge of the experience and uses Rust as a fast little simulation worker
under the hood — which is the architecture that matches both your
original ask and your existing codebase.
