# Stack Shooter: Visual Overhaul Baseline

**Baseline date:** 2026-08-24  
**Branch:** `codex-trial`  
**Scope:** Phase 0 only. This document records the current implementation before visual-overhaul work.

## Verification status

| Check | Result | Notes |
| --- | --- | --- |
| `npm run build` | PASS | Vite production build completed successfully outside the restricted process sandbox. |
| `npm run lint` | Dependency load fixed; full completion requires follow-up | The existing config now resolves `typescript-eslint`; the full repository lint invocation did not return a final status in this environment. A direct ESLint executable check and `typescript-eslint` module load both pass. |
| Automated test script | NOT AVAILABLE | `package.json` does not define an `npm test` script. |
| `npm run build:android` | Requires manual/device follow-up | Must be run with a locally available Android/Capacitor toolchain. |
| Debug APK launch | Requires manual/device verification | No emulator/device launch was performed as part of this baseline. |

The production build currently emits the Vite bundle, CSS, JavaScript, and committed WASM artifact successfully. The lint dependency mismatch was a tooling issue, not a gameplay or rendering issue.

## Current architecture

### Application shell

- `src/main.jsx` mounts the React application and renders `Game`.
- `src/components/Game.jsx` composes the Canvas, HUD, menus, overlays, and controls.
- React owns menu state, HUD state, pause state, upgrades, tutorial state, game-over state, input coordination, storage, and audio coordination.

### Simulation

- `engine-rs/src/lib.rs` contains the Rust/WASM simulation.
- The committed generated bindings and WASM binary live in `src/engine/pkg/`.
- The engine owns player movement, enemy movement, boss AI, collision, hitscan, health, dash state, particles, blood, and floating text.
- The engine exposes flat render buffers and getters consumed by JavaScript.

### Game loop and Canvas

- `src/engine/core/useGameLoop.js` initializes WASM, owns the JavaScript game state, schedules waves, collects input, advances the engine, updates HUD state, and renders the Canvas.
- The Canvas renderer currently draws the battlefield, player, enemies, boss bars, lasers, particles, blood, floating text, and ricochet effects from one game-loop module.
- `src/engine/systems/svgCharacters.js` provides the current procedural character rendering helpers.

### UI

- `src/components/Controls.jsx` implements desktop keyboard controls and mobile twin-stick touch input.
- `src/components/HUD.jsx` displays health, wave, enemy count, kills, score, dash cooldown, and energy.
- `src/components/UpgradeScreen.jsx` displays the existing upgrade choices.
- `src/components/PauseMenu.jsx` displays the current pause overlay.
- `src/components/GameOver.jsx` displays the current run summary and high-score result.
- `src/components/StartScreen.jsx` displays the home screen, difficulty selection, tutorial entry, and local high scores.

### Persistence, audio, and Android

- `src/engine/systems/gameStorage.js` stores local settings, scores, session data, and lifetime statistics.
- `src/engine/systems/sound.js` provides Web Audio synthesized fallbacks, optional file loading, music fallback, mute, and volume persistence.
- Capacitor Android packaging is configured through `capacitor.config.ts` and `android/`.
- Android is configured for landscape orientation in the manifest. Haptics is installed as a dependency but is not yet integrated into gameplay actions.

## Current assets and visual implementation

- The repository does not yet contain a game asset library under `src/assets/game/`.
- The only source asset currently present under `src/assets` is `react.svg`; generic splash/icon assets exist under `assets/` and Android resources.
- There is no sprite loading or animation renderer.
- There is no battlefield environment/decal/prop renderer.
- Characters and most combat visuals are currently procedural Canvas drawings and simple effects.

## Known baseline gaps

These are intentionally not fixed in Phase 0:

- Prototype-style HUD and menu styling remains in place.
- Mobile controls need safe-area, sizing, and touch-cancellation review.
- Bosses are represented as a special playing wave, not a separate game state.
- Boss intro and boss death sequences do not yet exist.
- Run duration is not currently tracked for the game-over screen.
- Pause currently exposes Resume and Exit only; restart/settings/run-stats/main-menu distinctions do not yet exist.
- Android back-button, app pause/resume, audio focus, screen sleep, and native system-bar behavior require device verification and later implementation.
- There is no automated gameplay test suite.

## Manual smoke-test matrix

The following must be verified in a browser and, where marked, on an Android landscape build:

### Startup and menus

- [ ] Application loads without console errors.
- [ ] Main menu renders.
- [ ] Difficulty selection opens and returns to the main menu.
- [ ] Easy, Normal, Hard, and Nightmare each start a run.
- [ ] Tutorial starts, advances, and transitions into gameplay.
- [ ] Existing local high scores load without breaking the home screen.

### Desktop gameplay

- [ ] WASD and arrow-key movement work.
- [ ] Mouse aiming works.
- [ ] Mouse shooting works and respects fire cooldown.
- [ ] Space activates dash and dash cooldown/energy behave correctly.
- [ ] Escape toggles pause and Resume returns to gameplay.
- [ ] Enemies can be killed and score/kills update.
- [ ] Player damage, health depletion, and game over work.
- [ ] Boss wave appears and the boss can be defeated.
- [ ] Upgrade screen appears after the appropriate wave and each upgrade changes the run.
- [ ] Restart returns to the start screen and a new run can begin.

### Mobile gameplay — Android landscape

- [ ] Left joystick moves independently of the right joystick.
- [ ] Right joystick aims and continuously fires while held.
- [ ] Dash button activates dash without interrupting joystick input.
- [ ] Pause button responds reliably.
- [ ] Controls remain usable on the target landscape aspect ratios.
- [ ] No touch control covers the central combat area.
- [ ] Android back behavior is recorded for gameplay and main-menu contexts.
- [ ] App background/resume behavior is recorded.
- [ ] Audio starts after user interaction and resumes/stops appropriately.
- [ ] Debug APK launches successfully on an emulator or physical device.

## Phase 0 exit criteria

Phase 0 is ready for Phase 1 when:

1. `npm install` completes from the committed manifests and lockfile.
2. `npm run build` passes.
3. `npm run lint` passes.
4. The browser smoke-test matrix is completed.
5. `npm run build:android` and the Android debug build are completed with a recorded device/emulator result.
6. Any gameplay regressions found during smoke testing are recorded before visual changes begin.
