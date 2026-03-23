class TileMap {
    constructor(width, height, tileSize = 32) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.tiles = [];
        this.visited = []; // For fog of war/minimap

        // Initialize empty map
        this.generateEmptyMap();
    }

    generateEmptyMap() {
        this.tiles = [];
        this.visited = [];
        for (let y = 0; y < this.height; y++) {
            const row = [];
            const visitedRow = [];
            for (let x = 0; x < this.width; x++) {
                row.push(0); // 0 = floor
                visitedRow.push(false);
            }
            this.tiles.push(row);
            this.visited.push(visitedRow);
        }
    }

    // Generate different map layouts based on level
    generateLevel(level) {
        this.generateEmptyMap();
        if (level <= 5) {
            this.generateFacilityMap(level);
        } else if (level <= 10) {
            this.generateCaveMap(level);
        } else {
            this.generateArenaMap(level);
        }
    }

    generateFacilityMap(level) {
        // Industrial theme with rooms and corridors
        // Start with walls
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = 1; // Wall
            }
        }

        // Create central room
        this.createRoom(10, 8, 10, 8);

        // Add side rooms
        this.createRoom(3, 5, 5, 5);
        this.createRoom(3, 15, 5, 5);
        this.createRoom(22, 5, 5, 5);
        this.createRoom(22, 15, 5, 5);

        // Connect with corridors
        this.createCorridor(8, 10, 3, 10); // Left
        this.createCorridor(17, 10, 3, 10); // Right
        this.createCorridor(13, 8, 13, 4); // Top
        this.createCorridor(13, 15, 13, 4); // Bottom

        // Add some random details
        for (let i = 0; i < 5 + level; i++) {
            const x = Utils.randomInt(2, this.width - 3);
            const y = Utils.randomInt(2, this.height - 3);
            if (this.tiles[y][x] === 0) {
                // Add decorative floor variations
                this.tiles[y][x] = Utils.randomInt(0, 3); // 0-2 are floor variants
            }
        }
    }

    generateCaveMap(level) {
        // Organic cavern style using cellular automata
        // Start random
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                // Border always wall
                if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
                    this.tiles[y][x] = 1;
                } else {
                    this.tiles[y][x] = Math.random() < 0.45 ? 1 : 0;
                }
            }
        }

        // Smooth with cellular automata
        for (let i = 0; i < 5; i++) {
            this.smoothCave();
        }

        // Ensure center is clear (player spawn)
        this.clearArea(12, 9, 6, 6);

        // Add some water pools
        for (let i = 0; i < 3 + Math.floor(level / 3); i++) {
            const cx = Utils.randomInt(5, this.width - 6);
            const cy = Utils.randomInt(5, this.height - 6);
            this.createWaterPool(cx, cy, 3, 3);
        }
    }

    generateArenaMap(level) {
        // Open arena with cover spots
        // Mostly floor
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = 0;
            }
        }

        // Border walls
        for (let x = 0; x < this.width; x++) {
            this.tiles[0][x] = 1;
            this.tiles[this.height - 1][x] = 1;
        }
        for (let y = 0; y < this.height; y++) {
            this.tiles[y][0] = 1;
            this.tiles[y][this.width - 1] = 1;
        }

        // Add cover barriers
        const numBarriers = 6 + level;
        for (let i = 0; i < numBarriers; i++) {
            const bx = Utils.randomInt(5, this.width - 8);
            const by = Utils.randomInt(5, this.height - 8);
            const bw = Utils.randomInt(2, 4);
            const bh = Utils.randomInt(2, 4);

            for (let y = by; y < by + bh; y++) {
                for (let x = bx; x < bx + bw; x++) {
                    if (y > 10 && y < 20 && x > 10 && x < 20) continue; // Keep center clear
                    this.tiles[y][x] = 1;
                }
            }
        }

        // Add lava hazards (damage tiles)
        for (let i = 0; i < 4 + Math.floor(level / 2); i++) {
            const lx = Utils.randomInt(3, this.width - 6);
            const ly = Utils.randomInt(3, this.height - 6);
            this.createLavaPool(lx, ly, 2, 2);
        }
    }

    createRoom(x, y, w, h) {
        for (let ry = y; ry < y + h; ry++) {
            for (let rx = x; rx < x + w; rx++) {
                if (rx >= 0 && rx < this.width && ry >= 0 && ry < this.height) {
                    this.tiles[ry][rx] = 0;
                }
            }
        }
    }

    createCorridor(x, y, w, h) {
        this.createRoom(x, y, w, h);
    }

    createWaterPool(x, y, w, h) {
        for (let ry = y; ry < y + h; ry++) {
            for (let rx = x; rx < x + w; rx++) {
                if (rx >= 0 && rx < this.width && ry >= 0 && ry < this.height) {
                    if (this.tiles[ry][rx] === 0) {
                        this.tiles[ry][rx] = 3; // Water
                    }
                }
            }
        }
    }

    createLavaPool(x, y, w, h) {
        for (let ry = y; ry < y + h; ry++) {
            for (let rx = x; rx < x + w; rx++) {
                if (rx >= 0 && rx < this.width && ry >= 0 && ry < this.height) {
                    if (this.tiles[ry][rx] === 0) {
                        this.tiles[ry][rx] = 4; // Lava
                    }
                }
            }
        }
    }

    clearArea(x, y, w, h) {
        this.createRoom(x, y, w, h);
    }

    smoothCave() {
        const newTiles = [];
        for (let y = 0; y < this.height; y++) {
            newTiles[y] = [...this.tiles[y]];
        }

        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                let wallCount = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (this.tiles[y + dy][x + dx] === 1) wallCount++;
                    }
                }

                if (wallCount > 4) {
                    newTiles[y][x] = 1;
                } else if (wallCount < 4) {
                    newTiles[y][x] = 0;
                }
            }
        }

        this.tiles = newTiles;
    }

    // Get tile at world position
    getTileAt(x, y) {
        const tx = Math.floor(x / this.tileSize);
        const ty = Math.floor(y / this.tileSize);

        if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) {
            return 1; // Wall outside bounds
        }

        return this.tiles[ty][tx];
    }

    // Check if position is walkable
    isWalkable(x, y) {
        const tile = this.getTileAt(x, y);
        return tile === 0 || tile === 2 || tile === 3; // Floor variants and water
    }

    // Check if position blocks bullets
    blocksBullet(x, y) {
        const tile = this.getTileAt(x, y);
        return tile === 1; // Only walls block bullets
    }

    // Check if tile slows movement
    slowsMovement(x, y) {
        const tile = this.getTileAt(x, y);
        return tile === 3; // Water slows
    }

    // Check if tile damages
    damagesPlayer(x, y) {
        const tile = this.getTileAt(x, y);
        return tile === 4; // Lava damages
    }

    // Mark area as visited (for minimap)
    markVisited(x, y, radius) {
        const tx = Math.floor(x / this.tileSize);
        const ty = Math.floor(y / this.tileSize);
        const r = Math.ceil(radius / this.tileSize);

        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                const vx = tx + dx;
                const vy = ty + dy;
                if (vx >= 0 && vx < this.width && vy >= 0 && vy < this.height) {
                    this.visited[vy][vx] = true;
                }
            }
        }
    }

    // Get spawn positions for enemies (away from player)
    getSpawnPositions(playerX, playerY, count) {
        const positions = [];
        const attempts = 100;

        for (let i = 0; i < count; i++) {
            for (let attempt = 0; attempt < attempts; attempt++) {
                const x = Utils.randomInt(1, this.width - 2) * this.tileSize + this.tileSize / 2;
                const y = Utils.randomInt(1, this.height - 2) * this.tileSize + this.tileSize / 2;

                // Must be walkable
                if (!this.isWalkable(x, y)) continue;

                // Must be far from player
                const dist = Utils.distance(x, y, playerX, playerY);
                if (dist < 300) continue;

                // Check not too close to other spawns
                let tooClose = false;
                for (const pos of positions) {
                    if (Utils.distance(x, y, pos.x, pos.y) < 50) {
                        tooClose = true;
                        break;
                    }
                }
                if (tooClose) continue;

                positions.push({ x, y });
                break;
            }
        }

        return positions;
    }

    render(ctx, cameraX, cameraY, playerX, playerY) {
        // Calculate visible tile range
        const startX = Math.floor(cameraX / this.tileSize) - 1;
        const startY = Math.floor(cameraY / this.tileSize) - 1;
        const endX = startX + Math.ceil(800 / this.tileSize) + 2;
        const endY = startY + Math.ceil(600 / this.tileSize) + 2;

        const visionRadius = 250;

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (x < 0 || x >= this.width || y < 0 || y >= this.height) continue;

                const tileX = x * this.tileSize;
                const tileY = y * this.tileSize;
                const tile = this.tiles[y][x];

                // Check if in vision
                const dist = Utils.distance(tileX + this.tileSize/2, tileY + this.tileSize/2, playerX, playerY);
                const isVisited = this.visited[y][x];
                
                if (dist < visionRadius) {
                    // Fully visible
                    this.renderTile(ctx, tile, tileX, tileY, 1.0);
                } else if (isVisited) {
                    // Visited but out of range (darker)
                    this.renderTile(ctx, tile, tileX, tileY, 0.3);
                } else {
                    // Completely hidden
                    ctx.fillStyle = '#000';
                    ctx.fillRect(tileX, tileY, this.tileSize, this.tileSize);
                }
            }
        }
        
        // Add a smooth vision gradient overlay
        const grad = ctx.createRadialGradient(playerX, playerY, visionRadius * 0.5, playerX, playerY, visionRadius);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.8)');
        
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 800, 600);
    }

    renderTile(ctx, tile, x, y, alpha = 1.0) {
        const size = this.tileSize;
        ctx.globalAlpha = alpha;

        switch (tile) {
            case 0: // Floor
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(x, y, size, size);
                // Subtle grid line
                ctx.strokeStyle = '#222';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, size, size);
                break;

            case 1: // Wall
                ctx.fillStyle = '#333';
                ctx.fillRect(x, y, size, size);
                // Wall detail
                ctx.fillStyle = '#444';
                ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
                ctx.fillStyle = '#555';
                ctx.fillRect(x + 8, y + 8, 4, 4);
                ctx.fillRect(x + 20, y + 12, 4, 4);
                // Border
                ctx.strokeStyle = '#222';
                ctx.strokeRect(x, y, size, size);
                break;

            case 2: // Floor variant (metal plate)
                ctx.fillStyle = '#2a2a2a';
                ctx.fillRect(x, y, size, size);
                ctx.fillStyle = '#333';
                ctx.fillRect(x + 4, y + 4, size - 8, size - 8);
                ctx.strokeStyle = '#3a3a3a';
                ctx.strokeRect(x, y, size, size);
                break;

            case 3: // Water
                ctx.fillStyle = '#1a3a4a';
                ctx.fillRect(x, y, size, size);
                // Water shimmer
                const shimmer = Math.sin(Date.now() / 500 + x * 0.1) * 0.1 + 0.1;
                ctx.fillStyle = `rgba(100, 150, 200, ${shimmer})`;
                ctx.fillRect(x + 4, y + 4, size - 8, size - 8);
                break;

            case 4: // Lava
                ctx.fillStyle = '#4a1a1a';
                ctx.fillRect(x, y, size, size);
                // Lava glow
                const glow = Math.sin(Date.now() / 300 + x * 0.2 + y * 0.1) * 0.3 + 0.5;
                ctx.fillStyle = `rgba(255, ${100 + glow * 100}, 0, ${glow})`;
                ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
                break;
        }
        
        ctx.globalAlpha = 1.0;
    }

    // Render minimap
    renderMinimap(ctx, playerX, playerY) {
        const scale = 4;
        const mapX = 800 - (this.width * scale) - 20;
        const mapY = 20;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(mapX - 5, mapY - 5, this.width * scale + 10, this.height * scale + 10);

        // Draw visited tiles
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (!this.visited[y][x]) continue;

                const tile = this.tiles[y][x];
                let color = '#333';

                switch (tile) {
                    case 0: color = '#444'; break;
                    case 1: color = '#666'; break;
                    case 3: color = '#468'; break;
                    case 4: color = '#a40'; break;
                }

                ctx.fillStyle = color;
                ctx.fillRect(mapX + x * scale, mapY + y * scale, scale, scale);
            }
        }

        // Draw player
        const px = Math.floor(playerX / this.tileSize);
        const py = Math.floor(playerY / this.tileSize);
        ctx.fillStyle = '#0f0';
        ctx.fillRect(mapX + px * scale - 1, mapY + py * scale - 1, scale + 2, scale + 2);
    }
}
