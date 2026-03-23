# Retro Shooter - Phase 2 Expansion Plan

## Phase 7: Maps & Terrains
Replace grid with actual tile-based maps with obstacles and different terrain types.

### Features:
- **Tile Map System**: 40x30 grid (32x32 tiles)
- **Terrain Types**:
  - Floor (walkable)
  - Wall (blocks movement and bullets)
  - Water (slows movement)
  - Lava (damages over time)
- **Map Editor/Loader**: Load level layouts from data
- **3 Map Themes**:
  - Facility (metal corridors, rooms)
  - Cave (rocky terrain, tight passages)
  - Arena (open with cover spots)
- **Minimap**: Show explored areas

## Phase 8: Powerup System
Enemies drop powerups on death with timed effects.

### Powerup Types:
- **Rapid Fire** (green): 2x fire rate for 10s
- **Damage Boost** (red): 2x bullet damage for 10s
- **Speed Boost** (blue): 1.5x movement speed for 8s
- **Multi Shot** (yellow): Shoot 3 parallel bullets for 8s
- **Shield** (cyan): Invincible for 5s
- **Health Pack** (white): Restore 25 HP (instant, not timed)

### Implementation:
- Powerup class with floating animation
- Magnet effect (attract to player when close)
- Visual indicator for active powerups
- Progress bars showing time remaining
- Particle effects when picking up

## Phase 9: Expanded Levels & Content
Increase from 10 to 15 levels with unique layouts.

### Level Progression:
- Level 1-5: Facility (industrial, corridors)
- Level 6-10: Cave (organic, tight spaces)
- Level 11-15: Hell/Arena (lava, open spaces, harder)

### New Features:
- **Boss Enemy** at levels 5, 10, 15
  - Large health bar
  - Unique attack patterns
  - Special death animation
- **Elite Enemies**: Randomly spawn with aura (faster/stronger)
- **Environmental Hazards**: Turret traps, spike floors

## Phase 10: Advanced Combat & Polish

### Weapon System:
- **Pistol**: Default, unlimited ammo
- **Shotgun**: Spread shot, limited ammo from powerups
- **Laser**: Piercing beam, limited duration

### Combo System:
- Chain kills within 3 seconds
- Multiplier increases score
- Visual combo counter

### Additional Visual Polish:
- Dynamic lighting around player
- Fog of war / vision radius
- Blood splatter stays on ground
- Bullet casings ejected
- Footstep particles

## File Structure Updates:
```
js/
├── tilemap.js       # Tile map class
├── terrain.js       # Terrain types
├── powerup.js       # Powerup class
├── boss.js          # Boss enemy
├── weapon.js        # Weapon types
└── combo.js         # Combo system
maps/
├── level1.json      # Map data for each level
└── ...
```

## Implementation Order:
1. Phase 7: Maps (foundation for gameplay variety)
2. Phase 8: Powerups (reward system, adds strategy)
3. Phase 9: More Levels + Bosses (content expansion)
4. Phase 10: Weapons + Combo (combat depth)
