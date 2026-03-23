# Top-Down Shooter Game - Implementation Plan

## Game Overview
A 2D retro-style top-down shooter with arrow key movement, mouse aiming/shooting, progressive levels, and varied enemies.

## Tech Stack
- **HTML5 Canvas** for rendering
- **Vanilla JavaScript** (no frameworks for simplicity)
- **CSS** for menu styling and retro aesthetic

## Core Architecture

### Game Loop
```
Update → Render → requestAnimationFrame
```

### Main Classes/Modules
1. **Game** - Main controller, state management
2. **Player** - Movement, shooting, animations
3. **Enemy** - Base enemy class with variants
4. **Bullet** - Projectile mechanics
5. **Particle** - Effects (muzzle flash, blood, explosions)
6. **Camera** (optional) - Screen shake, follow
7. **UI** - HUD, menus, score display

## Phase 1: Core Foundation
- [ ] HTML structure with canvas
- [ ] Basic game loop (update + render cycle)
- [ ] Input handling (keyboard + mouse)
- [ ] Simple CSS for retro pixel art feel

## Phase 2: Player System
- [ ] Player class with position, velocity
- [ ] Arrow key movement (WASD or arrows)
- [ ] Mouse tracking for aiming
- [ ] Shooting mechanics (click to fire)
- [ ] Gun sprite and recoil animation
- [ ] Player sprite with idle/walk animations

## Phase 3: Combat System
- [ ] Bullet class with velocity, lifetime
- [ ] Collision detection (bullet-enemy, enemy-player)
- [ ] Shooting cooldown/reload mechanic
- [ ] Simple particle effects (muzzle flash)

## Phase 4: Enemy System
- [ ] Base Enemy class
- [ ] Enemy spawning from screen edges (random angles)
- [ ] Enemy movement (chase player)
- [ ] Enemy types:
  - **Basic**: Slow, low health
  - **Fast**: Quick, low health
  - **Tank**: Slow, high health
  - **Ranged**: Stays back, shoots (Level 3+)
- [ ] Enemy death particles

## Phase 5: Level System
- [ ] Level progression (kill count or survive timer)
- [ ] Difficulty scaling:
  - Spawn rate increases
  - Enemy health/speed increases
  - New enemy types introduced
- [ ] Wave-based spawning
- [ ] Level transition screen

## Phase 6: UI & Menus
- [ ] Main menu (Start, Instructions)
- [ ] HUD (Health, Score, Level, Ammo)
- [ ] Game Over screen with restart
- [ ] Pause menu
- [ ] Retro pixel font (Press Start 2P)

## Phase 7: Polish
- [ ] Screen shake on hit
- [ ] Sound effects (synthesis or Web Audio API)
- [ ] Background grid/texture
- [ ] Better particle effects
- [ ] Balance tuning

## File Structure
```
/
├── index.html          # Main HTML
├── css/
│   └── style.css       # Retro styling
├── js/
│   ├── game.js         # Main game class
│   ├── player.js       # Player logic
│   ├── enemy.js        # Enemy classes
│   ├── bullet.js       # Projectile logic
│   ├── particle.js     # Effects
│   ├── input.js        # Input handling
│   ├── ui.js           # Menu/HUD
│   └── utils.js        # Helper functions
└── assets/             # (optional) sprites
```

## Visual Style
- 16x16 or 32x32 pixel sprites
- Limited color palette (retro feel)
- Black background with neon/grid accents
- Simple geometric shapes or pixel art

## Game Balance (V1)
- Player: 100 HP, 10 bullets/sec fire rate
- Level 1: Basic enemies only, slow spawn
- Level 2: Add Fast enemies, faster spawn
- Level 3: Add Tank enemies
- Level 4+: All types, increasing density

## Key Features for MVP
1. Smooth movement and shooting
2. At least 2 enemy types
3. 3-5 levels with visible progression
4. Score and basic HUD
5. Menu + Game Over screens
