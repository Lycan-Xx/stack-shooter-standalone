# Changelog

Complete project evolution timeline, major pivots, and future roadmap:

---

## 🎯 Project Evolution Phases

---

### 🦀 **Phase 3: Rust Rebuild Planning (Current - 2026)**
**Status: Active Planning / Architecture Phase**

✅ **Completed:**
- Full architectural analysis and decomposition of existing engine
- Engine/UI fully decoupled from React for portability
- Stripped all non-essential code to establish clean baseline
- Moved core game engine into isolated single directory structure
- Created complete technical blueprint for Rust/WASM migration
- Documented exact mapping patterns from JS implementation to Rust patterns
- Removed all remaining Reddit platform dependencies

🔮 **Planned:**
- Full game engine rewrite using Rust + WASM
- ECS (Entity Component System) architecture replacing class-based entities
- Wgpu hardware accelerated rendering
- Parallel physics processing with Rayon
- Object pooling to eliminate GC stutter
- Target: 10x performance improvement, support for 1000+ concurrent entities
- Native multi-platform support

---

### 🌐 **Phase 2: Standalone Web Pivot (2026)**
**Major Pivot: Decoupled from Reddit Devvit platform**

✅ **Completed:**
- ✅ **Decoupling**: Full extraction from Reddit Devvit ecosystem
- ✅ **Self Hosted**: Deployable independently on standard web infrastructure
- ✅ **Performance Rewrite**: Complete visual and performance overhaul
- ✅ **Procedural Rendering**: Removed all external assets, implemented SVG-style procedural characters
- ✅ **Boss System**: Added multi-phase boss waves and ricochet mechanics
- ✅ **Mobile Support**: Dedicated touch controls and fire button
- ✅ **Leaderboards & Challenges**: Daily challenges, full async leaderboard system
- ✅ **Vercel Analytics**: Integrated web analytics
- ✅ **Removed Multiplayer**: Abandoned realtime multiplayer after confirming Devvit platform limitations

📖 **Context:**
This pivot was initiated after discovering that Reddit's Devvit platform did not support the realtime multiplayer capabilities required for the original vision. Decision was made to target the open web and build a high performance standalone game that could exist outside the Reddit ecosystem.

---

### 🚀 **Phase 1: Reddit Only App (2025 -> Early 2026)**
**Original Concept: Reddit native game built on Devvit platform**

✅ **Completed:**
- ✅ Initial game prototype and working gameplay
- ✅ Full Reddit platform integration
- ✅ Reddit Snoo avatar support
- ✅ Realtime multiplayer attempted and prototyped
- ✅ Game engine foundation built
- ✅ Leaderboards, stats and user authentication using Reddit accounts
- ✅ Devvit server backend with Redis persistence
- ✅ Multiplayer matchmaking, PvP game engine

⚠️ **Challenges Encountered:**
- Devvit platform limitations prevented reliable realtime multiplayer
- Performance constraints on Reddit embedded webview
- Restricted asset loading and platform sandbox limitations

---

## 📈 Release History

| Version | Date | Milestone |
|---------|------|-----------|
| v0.1 | Dec 2025 | Initial game prototype |
| v0.5 | Jan 2026 | Reddit Devvit integration complete |
| v0.8 | Feb 2026 | Multiplayer prototype built |
| v1.0 | Mar 2026 | Standalone pivot initiated |
| v1.5 | Apr 2026 | Performance rewrite & Boss waves |
| v2.0 | *Future* | Rust / WASM rebuild |

---

## 🎮 Current Status
✅ **Game is fully working standalone web application**
✅ Runs on desktop and mobile browsers
✅ No external dependencies
✅ Complete single player experience with progression
✅ Ready for Rust migration