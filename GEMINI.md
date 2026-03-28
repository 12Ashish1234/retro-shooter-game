# Gemini Instructions - Retro Shooter

This document provides context and instructions for AI agents (like Gemini) working on the Retro Shooter project.

## 🚀 Project Overview

**Retro Shooter** is a vanilla JavaScript top-down shooter game built using HTML5 Canvas. It features procedural level generation, a variety of enemy types, a powerup system, and a synthesized audio system.

### Key Technologies
- **JavaScript (ES6+):** Pure vanilla JS, no external libraries or frameworks.
- **HTML5 Canvas:** For all rendering logic.
- **Web Audio API:** For real-time sound synthesis (no static audio files).
- **CSS3:** For UI overlays and retro aesthetics.

### Architecture
- **State-Driven:** The game uses a finite state machine (`MENU`, `PLAYING`, `PAUSED`, `GAMEOVER`, `VICTORY`) managed in `game.js`.
- **Modular Design:** Each system is separated into its own module in `shooter-game/js/`:
  - `game.js`: Entry point, main loop, and state management.
  - `player.js` & `enemy.js`: Entity logic, movement, and FSM for enemies.
  - `bullet.js` & `weapon.js`: Projectile physics and weapon profiles.
  - `tilemap.js`: Procedural chunk-based map generation.
  - `powerup.js`: Management of buffs and stat modifiers.
  - `particle.js`: Visual effects system.
  - `audio.js`: Real-time sound synthesis.
  - `level.js`: Wave management and level progression.

## 🛠️ Building and Running

### Running the Game
1.  Navigate to the `shooter-game` directory.
2.  Open `index.html` in any modern web browser.
3.  The game is self-contained and does not require a build step or local server (though a local server like `live-server` is recommended for development).

### Building/Testing
- **TODO:** Currently, there is no automated testing or build pipeline.
- **CI:** A basic GitHub Action is configured in `.github/workflows/main.yml` to check out the code on push/PR.

## 📏 Development Conventions

### Coding Style
- **Class-Based:** Use ES6 classes for major game components.
- **CamelCase:** Use camelCase for variables and functions.
- **PascalCase:** Use PascalCase for Class names.
- **Comments:** Provide concise comments for complex mathematical logic or state transitions.

### Key Patterns
- **Entity Update/Render:** All game entities should implement `update(deltaTime)` and `render(ctx)` methods.
- **World Space vs. Screen Space:** The game uses a world coordinate system. When rendering, ensure objects are translated relative to the camera position.
- **Object Pooling:** Bullets utilize an object pool (`BulletPool` in `bullet.js`) to minimize garbage collection overhead. Use similar patterns for frequently created/destroyed objects.
- **Seeded Randomness:** Use `Utils.seededRandom` for any procedural generation to ensure consistency across chunks and levels.

### Asset Management
- **Visuals:** All graphics are rendered programmatically via Canvas API. Do not add external image assets unless specifically requested.
- **Audio:** All sounds are synthesized in `audio.js`. Do not add external MP3/WAV files.

## 🗺️ Roadmap
- Refer to `game-plan.md` and `game-plan-phase2.md` for completed and upcoming features.
