# Stack Shooter: Vampire Siege

## Level 1 + Level 2 Upgrade Implementation Specification

**Target:** Transform the existing playable Stack Shooter build into a polished, mobile-first dark-fantasy action game closely matching the generated design concepts, while preserving the existing React + Canvas + Rust/WASM architecture.

**Primary platform:** Android landscape
**Secondary platform:** Desktop/Web
**Architecture policy:** No engine rewrite during this phase.

---

# 1. Project Objective

The current game already contains the core gameplay systems:

* movement
* aiming
* shooting
* dash
* waves
* difficulty modes
* normal enemies
* boss encounters
* upgrades
* pause state
* tutorial
* game-over state
* Rust/WASM simulation
* Canvas rendering
* Android/Capacitor packaging

The goal of this project is therefore **not to rebuild the game**.

The goal is to transform:

> Functional prototype → polished mobile game.

The finished Level 2 version should visually resemble the approved mockups in atmosphere and interface while remaining realistic for a browser/Capacitor-based 2D game.

---

# 2. Non-Negotiable Architecture Rules

Before implementation begins, establish the following rules.

## 2.1 Freeze the simulation layer

Do not modify the Rust engine unless a visual feature absolutely requires new engine information.

Existing mechanics such as:

* enemy movement
* collision
* health
* damage
* boss AI
* hitscan/shooting
* dash
* player movement

must remain functional.

Visual work should consume existing game state rather than rewrite it.

---

## 2.2 Preserve existing game states

The existing structure should remain conceptually:

```text
start
   ↓
playing
   ↓
boss
   ↓
upgrade
   ↓
playing
   ↓
gameOver
```

Additional states may later be introduced, such as:

```text
settings
records
modeSelect
bossIntro
```

but current working states should not be removed.

---

## 2.3 UI and rendering must remain separate

React should continue handling:

* menus
* buttons
* HUD
* pause screens
* upgrade selection
* game-over
* settings
* mobile controls

Canvas should handle:

* battlefield
* player
* enemies
* boss
* bullets
* effects
* environment

Rust/WASM should continue handling simulation.

---

# 3. Development Strategy

Implementation will happen in waves.

Each wave must be:

1. independently testable
2. independently deployable
3. committed separately
4. verified on browser
5. verified on Android where applicable

Do not implement the entire redesign in one AI-agent instruction.

---

# WAVE 0 — STABILIZE AND BASELINE

## Goal

Create a known-good baseline before visual modifications begin.

## Estimated duration

**2–4 hours**

---

## Tasks

Create a new branch:

```bash
git checkout -b feat/mobile-visual-overhaul
```

Verify:

```bash
npm install
npm run build
npm run dev
```

Then verify Android:

```bash
npm run build:android

cd android
./gradlew assembleDebug
```

---

## Test all existing systems

Verify manually:

* main menu loads
* Easy starts
* Normal starts
* Hard starts
* Nightmare starts
* movement works
* desktop aiming works
* mobile movement works
* mobile aiming works
* firing works
* dash works
* pause works
* boss appears
* boss can die
* upgrade screen appears
* upgrade modifies player
* game over works
* restart works
* tutorial works

---

## Deliverable

Create:

```text
docs/visual-overhaul-baseline.md
```

Document:

* known bugs
* current screenshots
* current Android behavior
* current FPS
* current controls
* current build status

---

## Acceptance criteria

No visual work begins until:

```text
npm run build
```

passes and an Android debug APK launches successfully.

---

# WAVE 1 — CREATE THE GAME DESIGN SYSTEM

## Goal

Create one unified visual language that every screen uses.

## Estimated duration

**0.5–1 day**

---

# 1.1 Color system

Create CSS variables rather than hardcoding colors throughout components.

Suggested starting palette:

```css
:root {
  --game-bg: #080c12;
  --game-bg-secondary: #0d131c;

  --panel: rgba(12, 20, 30, 0.88);
  --panel-light: rgba(20, 31, 44, 0.88);

  --border: rgba(125, 190, 255, 0.25);

  --blue: #67c8ff;
  --blue-bright: #91dbff;

  --red: #ff3f4f;
  --red-dark: #8e1625;

  --green: #58df8a;

  --gold: #f4b942;

  --text: #edf3f8;
  --text-secondary: #99a7b4;

  --danger: #ff4757;
}
```

---

# 1.2 Typography

Use a maximum of three fonts.

Recommended roles:

### Display/headings

```text
Space Grotesk
```

### Technical labels

```text
JetBrains Mono
```

### Body text

```text
Hanken Grotesk
```

---

# 1.3 Shared UI primitives

Create reusable styles/components for:

```text
GamePanel
GameButton
IconButton
ProgressBar
StatBadge
ModalOverlay
GameCard
SectionHeading
```

Potential structure:

```text
src/components/ui/
    GameButton.jsx
    GamePanel.jsx
    ProgressBar.jsx
    StatBadge.jsx
    IconButton.jsx
```

Avoid duplicating visual logic across screens.

---

# 1.4 Glass panel treatment

Standard panel:

```text
dark translucent background
1px blue-gray border
subtle blue outer glow
small 6–10px radius
backdrop blur where appropriate
```

Do not overuse glass effects inside Canvas gameplay.

---

# Acceptance criteria

Start screen, pause screen, upgrade screen and HUD must all be capable of using the same design tokens.

---

# WAVE 2 — ASSET FOUNDATION

## Goal

Create the asset structure before changing rendering.

## Estimated duration

**1 day setup + ongoing asset production**

---

# 2.1 Asset directories

Create:

```text
src/assets/game/
    player/
    enemies/
    bosses/
    environments/
    effects/
    ui/
    upgrades/
    backgrounds/
    audio/
```

---

# 2.2 Initial asset pack

Minimum required:

## Player

```text
player_idle
player_move
player_fire
player_dash
player_hit
player_death
```

## Basic enemy

```text
vampire_basic_idle
vampire_basic_move
vampire_basic_attack
vampire_basic_hit
vampire_basic_death
```

## Boss

```text
boss_idle
boss_move
boss_attack
boss_special
boss_hit
boss_death
```

---

# 2.3 Environment

Create:

```text
ground_stone
ground_cracks
grave_01
grave_02
dead_tree
ruined_wall
pillar
candles
bones
blood_stain_01
blood_stain_02
fog_patch
```

---

# 2.4 Combat effects

Create:

```text
muzzle_flash
bullet_tracer
impact_spark
blood_hit
blood_splash
enemy_death
dash_trail
boss_shockwave
boss_spawn
upgrade_glow
```

---

# 2.5 UI icons

Create consistent icons for:

```text
health
energy
pause
fire
dash
wave
enemy
boss
kills
score
settings
home
retry
leaderboard
```

---

# 2.6 Upgrade icons

Required:

```text
vitality
firepower
rapid_fire
agility
quick_dash
piercing
```

---

# Asset requirements

Gameplay assets should preferably be:

```text
PNG or WebP
transparent background
consistent camera angle
consistent lighting
consistent scale
```

UI icons:

```text
SVG preferred
```

Background artwork:

```text
WebP
1920×1080 minimum
```

---

# WAVE 3 — MOBILE GAMEPLAY CONTROL REDESIGN

## Goal

Implement the approved landscape gameplay interface.

## Estimated duration

**1–2 days**

The existing mobile control component already implements left movement and right aiming joysticks, including independent touch identifiers, plus dash and pause. Preserve that working touch logic while changing the presentation.

---

# 3.1 Left movement control

Keep the current movement joystick.

Redesign visually as:

```text
large translucent outer circle
smaller illuminated thumb
blue-white highlight
very low opacity when idle
higher opacity while touched
```

Target approximate mobile diameter:

```text
120–160px
```

depending on screen size.

---

# 3.2 Right combat control

Current implementation uses an aim joystick.

For the Level 2 target, preserve this internally while visually presenting it as:

```text
large FIRE / targeting circle
```

Behavior:

```text
touch + drag
    ↓
aim direction
    ↓
automatic firing while held
```

This maintains the existing twin-stick behavior while matching the mockup.

---

# 3.3 Dash

Create a dedicated dash circle.

Behavior:

```text
available
→ bright blue

cooldown
→ darkened

charging
→ radial progress

ready again
→ pulse
```

Capacitor haptic feedback should trigger when dash activates.

---

# 3.4 Pause

Place pause at:

```text
top-left
```

Minimum touch area:

```text
48 × 48px
```

---

# 3.5 Touch-safe spacing

Maintain:

```text
16–32px from screen edge
```

and account for:

```css
env(safe-area-inset-left)
env(safe-area-inset-right)
```

---

# Acceptance criteria

A player must be able to:

* move
* aim
* continuously fire
* dash
* pause

without fingers covering the player or center combat region.

---

# WAVE 4 — GAMEPLAY HUD REDESIGN

## Goal

Replace the existing debug-style HUD with the mockup HUD.

## Estimated duration

**1 day**

The current HUD already exposes health, maximum health, wave, enemy count, kills, score, dash energy and cooldown.

Therefore no engine work should be required.

---

# New HUD layout

## Top-left

```text
PAUSE
```

---

## Top-center-left

```text
♥ HEALTH

██████████████
85 / 100
```

---

## Top-center-right

```text
⚡ ENERGY

██████████████
100 / 100
```

---

## Top-right

```text
250
WAVE 3

☠ ENEMIES 5
```

During bosses:

```text
☠ BOSS 1
☠ ENEMIES 4
```

---

# 4.1 Remove desktop information noise on mobile

Do not show:

```text
Ammo: ∞
difficulty badge
large debug-style stats box
```

during normal mobile combat.

Difficulty may appear briefly when a run begins.

---

# 4.2 Damage state

When HP falls below:

```text
30%
```

health UI should pulse subtly red.

Do not continuously flash the entire screen.

---

# WAVE 5 — BATTLEFIELD ENVIRONMENT PASS

## Goal

Make the current empty battlefield visually resemble the approved gothic arena.

## Estimated duration

**2–4 days**

This is the first major Level 2 step.

---

# 5.1 Add battlefield background

Instead of a flat canvas color:

```text
dark stone battlefield
```

should cover the arena.

Render background before entities.

Conceptual order:

```text
ground
↓
ground decals
↓
environment props
↓
enemies/player
↓
effects
↓
foreground atmosphere
```

---

# 5.2 Environment decoration

Randomly place non-colliding objects:

```text
gravestones
pillars
broken walls
dead trees
candles
bones
blood stains
```

These should initially be visual only.

Do not add collision until later.

---

# 5.3 Environmental distribution

Generate decoration when the run begins.

Use deterministic or seeded placement if practical.

Example:

```text
15–30 small props
4–8 large props
10–20 ground decals
```

Do not overcrowd the gameplay area.

---

# 5.4 Edge treatment

Darken arena boundaries.

Use:

```text
fog
shadows
trees
ruined architecture
red moon glow
```

toward outer edges.

Keep center battlefield readable.

---

# WAVE 6 — SPRITE RENDERING SYSTEM

## Goal

Replace procedural-looking characters with proper sprite assets.

## Estimated duration

**3–5 days**

Do not remove the simulation.

Only change how positions are rendered.

---

# 6.1 Create sprite renderer

Suggested module:

```text
src/engine/systems/spriteRenderer.js
```

Responsibilities:

```text
load sprite sheets
select animation
advance frames
draw frame
rotate where appropriate
scale sprite
flip sprite
```

---

# 6.2 Entity animation state

Visual renderer should infer:

```text
idle
moving
attacking
hurt
dying
```

from engine/game state where possible.

Avoid adding these directly into Rust unless necessary.

---

# 6.3 Player rendering

Replace current player representation with:

```text
hooded / armored vampire hunter
blue accent lighting
gun visible
clear directional silhouette
```

Required feedback:

```text
movement animation
gun flash
dash streak
damage flash
death animation
```

---

# 6.4 Enemy rendering

Initial release needs only:

```text
basic vampire
fast vampire
heavy vampire
```

You can initially use recolors/scaled variants if necessary.

---

# 6.5 Boss rendering

Boss must visually occupy approximately:

```text
2×–3× standard enemy scale
```

and be instantly identifiable.

---

# WAVE 7 — COMBAT FEEDBACK PASS

## Goal

Make shooting and kills feel satisfying.

## Estimated duration

**2–3 days**

This wave is disproportionately important.

Good combat feedback can make inexpensive artwork feel expensive.

---

# 7.1 Shooting feedback

Every shot should include some combination of:

```text
muzzle flash
tracer
small recoil
gun sound
tiny screen vibration/haptic
```

---

# 7.2 Hit feedback

Enemy hit:

```text
brief white/red flash
blood burst
impact spark
damage number
```

Optional later:

```text
small enemy knockback
```

---

# 7.3 Death feedback

Enemy death:

```text
blood burst
sprite collapse/fade
particles
score popup
```

Avoid enemies simply disappearing.

---

# 7.4 Screen shake

Very subtle for normal shots.

Stronger for:

```text
boss attacks
boss death
dash collision
special weapon effects
```

Provide a settings toggle later.

---

# WAVE 8 — BOSS PRESENTATION

## Goal

Make bosses feel like major checkpoints.

## Estimated duration

**1–2 days**

---

# 8.1 Boss entrance

Before boss spawn:

```text
ambient sound lowers
screen darkens
red glow appears
```

Display:

```text
BOSS WAVE
```

for approximately:

```text
1–1.5 seconds
```

Then spawn boss.

---

# 8.2 Boss HUD

Add:

```text
VAMPIRIC LORD MALGOR

█████████████████████
1850 / 2500
```

across upper center.

Do not hide player HP.

---

# 8.3 Boss death

Boss death sequence:

```text
final hit
↓
short slow-motion effect
↓
large death particles
↓
screen shake
↓
BOSS DEFEATED
↓
upgrade screen
```

Keep total delay short:

```text
2–3 seconds
```

---

# WAVE 9 — UPGRADE SCREEN REDESIGN

## Goal

Implement the generated upgrade screen while preserving existing upgrade logic.

## Estimated duration

**0.5–1 day**

The current `UpgradeScreen` already maps available upgrades and calls `onSelectUpgrade(upgrade.key)` on selection, so the gameplay logic can remain intact.

---

# Layout

```text
BOSS DEFEATED

CHOOSE YOUR UPGRADE

[ RAPID FIRE ]
[ PIERCING SHOTS ]
[ VITALITY ]
```

---

# Upgrade cards

Each card contains:

```text
icon
name
category
short description
actual stat change
current level → next level
```

Example:

```text
RAPID FIRE

WEAPON

Increase fire rate by 25%

FIRE RATE +25%

LEVEL 2 → 3
```

---

# Card color categories

Suggested:

```text
red = offensive
blue = weapon/technical
green = survival
gold = rare
purple = special
```

---

# Selection animation

On tap:

```text
selected card flashes
other cards dim
upgrade sound
short glow
resume gameplay
```

Target transition:

```text
300–500ms
```

---

# Optional reroll

Do not monetize rerolls yet.

For Level 2:

```text
1 free reroll per boss reward
```

may be added if desired.

---

# WAVE 10 — PAUSE MENU REDESIGN

## Goal

Implement the approved pause screen.

## Estimated duration

**0.5–1 day**

---

# Options

Use:

```text
RESUME GAME

RESTART RUN

SETTINGS

RUN STATS

EXIT TO MAIN MENU
```

Do not have both:

```text
Exit to Main Menu
Quit Game
```

unless desktop requires actual app termination.

For mobile, Android handles application exit.

---

# Background

Freeze gameplay.

Apply:

```text
dark overlay
subtle blur
desaturation
```

Do not render a completely separate battlefield.

---

# Confirmation

Require confirmation only for:

```text
Restart Run
Exit to Main Menu
```

if progress will be lost.

---

# WAVE 11 — GAME-OVER EXPERIENCE

## Goal

Implement the cinematic failure screen.

## Estimated duration

**1 day**

---

# Headline

Use:

```text
THE NIGHT HAS CLAIMED YOU
```

Optional subtitle:

```text
YOUR HUNT ENDS HERE
```

Avoid overly technical wording like:

```text
SYSTEM FAILURE
```

unless you intentionally keep the techno-gothic story framing.

---

# Stats

Show:

```text
Waves survived
Kills
Score
Time survived
Difficulty
```

XP should only appear when actual meta progression exists.

---

# Actions

Primary:

```text
RETRY
```

Secondary:

```text
MAIN MENU
```

Optional:

```text
RECORDS
```

---

# WAVE 12 — MAIN APP HOME SCREEN

## Goal

Replace the simple current menu with a believable mobile game home.

## Estimated duration

**1–2 days**

Do not build nonexistent systems merely because they appeared in concept art.

---

# Initial realistic home screen

Top:

```text
Stack Shooter
Vampire Siege
```

Player summary:

```text
Best Wave
Total Kills
Difficulty preference
```

Main CTA:

```text
QUICK START
```

---

# Game modes

Use existing functionality:

```text
Easy
Normal
Hard
Nightmare
Tutorial
```

These can be visually renamed if desired, but underlying difficulty constants remain unchanged.

---

# Secondary items

Initially:

```text
Records
Settings
Tutorial
```

Do not implement yet:

```text
Clan
Store
Battle Pass
Live Events
Armory
premium currencies
```

Those belong to a later meta-progression phase.

---

# WAVE 13 — AUDIO AND HAPTICS

## Goal

Give the visual redesign matching physical feedback.

## Estimated duration

**1–2 days**

---

# Audio requirements

Add/rework:

```text
gunshot
enemy hit
enemy death
boss hit
boss spawn
boss death
dash
upgrade
UI click
pause
game over
background music
boss music
```

---

# Haptics

Use short haptics for:

```text
dash
player hit
boss spawn
upgrade selected
```

Optional:

```text
strong boss death vibration
```

Avoid vibration on every gunshot.

---

# WAVE 14 — MOBILE PERFORMANCE PASS

## Goal

Maintain acceptable Android performance.

## Estimated duration

**2–4 days**

---

# Target

Minimum:

```text
stable 50–60 FPS
```

on a reasonable mid-range Android phone.

Acceptable fallback:

```text
stable 30 FPS
```

on weaker hardware.

---

# Monitor

Profile:

```text
Canvas rendering
sprite count
particle count
image scaling
React HUD updates
WASM calls
garbage collection
```

---

# Optimization rules

Do not:

```text
allocate new particle objects excessively every frame
load images during combat
rerender React HUD every animation frame
use huge 4K sprites
use expensive blur effects over Canvas
```

---

# Sprite atlas

If many individual images create overhead, combine them into:

```text
sprite atlas
```

later.

---

# Particle caps

Example:

```text
blood particles ≤ 250
spark particles ≤ 150
ambient particles ≤ 100
```

Adapt based on profiling.

---

# WAVE 15 — ANDROID NATIVE POLISH

## Goal

Make the Capacitor build feel like an actual game rather than a web page.

## Estimated duration

**1–2 days**

---

# Requirements

Lock:

```text
landscape
```

Hide:

```text
navigation chrome where appropriate
status bar where appropriate
```

Handle:

```text
Android back button
app resume
app pause
audio focus
screen orientation
safe areas
```

---

# Android back behavior

During gameplay:

```text
Back
↓
Pause Menu
```

From main menu:

```text
Back
↓
normal Android exit/background behavior
```

---

# Screen sleep

Prevent screen from sleeping during active gameplay if practical.

---

# WAVE 16 — QA AND RELEASE CANDIDATE

## Goal

Produce a stable Level 2 release candidate.

## Estimated duration

**2–4 days**

---

# Test matrix

Test at minimum:

```text
16:9 landscape
18:9 landscape
19.5:9 landscape
20:9 landscape
```

---

# Gameplay testing

Verify:

```text
100+ enemies
boss fight
multiple upgrade rounds
long run
pause/resume
background/resume Android app
restart
game over
orientation
touch controls
```

---

# Visual testing

Check:

```text
text readable
controls not blocked
safe-area correct
boss health visible
player health visible
effects don't hide enemies
background doesn't reduce contrast
```

---

# Performance testing

Record:

```text
FPS
memory usage
long-run degradation
APK startup time
WASM initialization
```

---

# 4. Recommended AI Agent Workflow

Do not give the agent this whole document and say:

> Implement everything.

Use one phase at a time.

---

## Example Wave 3 prompt

```text
Implement Wave 3 of the Stack Shooter mobile overhaul.

Scope:
- src/components/Controls.jsx
- src/components/Controls.css

Goal:
Redesign the existing mobile touch controls to match the approved landscape gameplay mockup.

Important constraints:
- Do not modify Rust.
- Do not modify game mechanics.
- Preserve the existing left joystick movement logic.
- Preserve the existing right aiming joystick behavior and mobileFireActive behavior.
- Preserve dash functionality.
- Preserve pause functionality.
- Desktop controls must continue working.

Visual target:
- translucent circular joystick bottom-left
- large circular aim/fire control bottom-right
- smaller dash button immediately left of fire
- pause button top-left
- responsive layout
- Android safe-area support

After implementation:
1. run npm build
2. report modified files
3. explain any behavior changes
4. identify anything that requires manual testing.
```

---

# 5. Recommended Commit Structure

Use one commit per meaningful implementation step.

Examples:

```text
feat(ui): add stack shooter design tokens

feat(controls): redesign landscape mobile controls

feat(hud): implement mobile combat HUD

feat(render): add battlefield environment renderer

feat(render): add sprite animation system

feat(vfx): add combat hit and muzzle effects

feat(boss): add cinematic boss presentation

feat(upgrades): redesign boss reward selection

feat(pause): redesign pause menu

feat(game-over): add cinematic run summary

feat(home): redesign main game menu

feat(android): polish landscape native behavior

perf(render): optimize sprite and particle rendering
```

---

# 6. Overall Timeline

With a capable AI coding agent and active human testing:

| Phase                       | Expected Time |
| --------------------------- | ------------: |
| Wave 0–1 Foundation         |         1 day |
| Assets setup                |         1 day |
| Controls + HUD              |      2–3 days |
| Environment                 |      2–4 days |
| Sprite renderer             |      3–5 days |
| Combat VFX                  |      2–3 days |
| Boss presentation           |      1–2 days |
| Upgrade + pause + game over |      2–3 days |
| Home screen                 |      1–2 days |
| Audio/haptics               |      1–2 days |
| Performance                 |      2–4 days |
| Android polish              |      1–2 days |
| QA                          |      2–4 days |

### Practical target

**Around 3–4 weeks** for a convincing Level 2 version.

An aggressive implementation could reach a strong Level 1 build in roughly:

**5–7 days.**

---

# 7. Milestones

## Milestone A — Level 1

Complete when:

* redesigned home
* polished HUD
* proper mobile controls
* boss HUD
* upgrade screen
* pause menu
* game-over screen
* responsive landscape UI
* Android controls stable

At this point, the game should already feel dramatically more professional even with existing character rendering.

---

## Milestone B — Level 2 Alpha

Complete when:

* gothic battlefield added
* real character sprites
* boss sprite
* basic environment props
* muzzle flashes
* blood effects
* death effects
* dash effects
* boss entrance
* improved audio

This should visually resemble the generated gameplay concepts.

---

## Milestone C — Level 2 Release Candidate

Complete when:

* performance stable
* Android native behavior polished
* controls comfortable
* graphical effects optimized
* all screens consistent
* no major gameplay regressions
* long runs tested successfully

---

# 8. Explicitly Out of Scope

Do not introduce these during this overhaul:

```text
multiplayer
clans
store
real-money purchases
battle pass
cloud accounts
backend leaderboard
loot boxes
large weapon inventory
full ECS rewrite
wgpu renderer
Unity/Godot migration
full Rust UI
```

These can be Phase 3 features later.

The goal now is to finish and polish the game you already have.

---

# 9. First Implementation Order

Begin in exactly this sequence:

```text
1. Baseline branch + tests
        ↓
2. Design system
        ↓
3. Mobile controls
        ↓
4. HUD
        ↓
5. Upgrade screen
        ↓
6. Pause
        ↓
7. Game over
        ↓
8. Home screen
        ↓
9. Environment
        ↓
10. Player sprite
        ↓
11. Enemy sprites
        ↓
12. Boss sprite
        ↓
13. Combat effects
        ↓
14. Boss presentation
        ↓
15. Audio/haptics
        ↓
16. Optimization
        ↓
17. Android polish
        ↓
18. QA
```

The important strategy is:

> **Complete Level 1 before touching the major renderer transformation.**

That gives you a polished, playable checkpoint before Level 2 begins.

If the sprite/environment work later encounters difficulties, you will still have a dramatically improved game rather than a half-finished rewrite.
