class LevelManager {
    constructor(game) {
        this.game = game;
        this.currentLevel = 1;
        this.maxLevel = 15;

        // Wave spawning
        this.waveInProgress = false;
        this.waveNumber = 0;
        this.enemiesToSpawn = 0;
        this.spawnTimer = 0;
        this.spawnDelay = 2000; // ms between spawns

        // Level transition
        this.levelTransitionTimer = 0;
        this.showingLevelScreen = false;

        // Difficulty scaling
        this.enemyHealthMultiplier = 1;
        this.enemySpeedMultiplier = 1;
        this.spawnRateMultiplier = 1;

        // Wave configuration
        this.waveConfig = this.generateWaveConfig();
    }

    generateWaveConfig() {
        return {
            1: { basic: 5, fast: 0, tank: 0, elite: 0 },
            2: { basic: 8, fast: 0, tank: 0, elite: 0 },
            3: { basic: 6, fast: 3, tank: 0, elite: 0 },
            4: { basic: 8, fast: 5, tank: 0, elite: 1 },
            5: { boss: true, theme: 'Facility Boss' },
            6: { basic: 8, fast: 6, tank: 3, elite: 1 },
            7: { basic: 10, fast: 8, tank: 4, elite: 2 },
            8: { basic: 12, fast: 10, tank: 5, elite: 2 },
            9: { basic: 15, fast: 12, tank: 6, elite: 3 },
            10: { boss: true, theme: 'Cave Boss' },
            11: { basic: 15, fast: 15, tank: 8, elite: 4 },
            12: { basic: 18, fast: 18, tank: 10, elite: 5 },
            13: { basic: 20, fast: 20, tank: 12, elite: 6 },
            14: { basic: 25, fast: 25, tank: 15, elite: 8 },
            15: { boss: true, theme: 'Final Arena Boss' }
        };
    }

    startLevel(level) {
        this.currentLevel = level;
        this.waveNumber = 0;
        this.showingLevelScreen = true;
        this.levelTransitionTimer = 3000; // Show for 3 seconds

        // Play level up sound
        Audio.playLevelUp();

        // Calculate difficulty multipliers
        this.enemyHealthMultiplier = 1 + (level - 1) * 0.15;
        this.enemySpeedMultiplier = 1 + (level - 1) * 0.08;
        this.spawnRateMultiplier = Math.max(0.3, 1 - (level - 1) * 0.08);

        // Generate new tilemap for this level
        if (this.game.tileMap) {
            this.game.tileMap.generateLevel(level);
        }

        // Start first wave after level screen
        setTimeout(() => {
            this.showingLevelScreen = false;
            if (this.waveConfig[this.currentLevel].boss) {
                this.startBossWave();
            } else {
                this.startWave(1);
            }
        }, 3000);
    }

    startWave(waveNum) {
        this.waveNumber = waveNum;
        this.waveInProgress = true;

        const config = this.waveConfig[this.currentLevel] || this.waveConfig[1];

        // Calculate enemies for this wave (distribute across multiple waves per level)
        const totalWaves = 3;
        const waveIndex = waveNum - 1;

        this.enemiesToSpawn = {
            basic: Math.floor(config.basic / totalWaves) + (waveIndex === 0 ? config.basic % totalWaves : 0),
            fast: Math.floor(config.fast / totalWaves) + (waveIndex === 1 ? config.fast % totalWaves : 0),
            tank: Math.floor(config.tank / totalWaves) + (waveIndex === 2 ? config.tank % totalWaves : 0),
            elite: Math.floor((config.elite || 0) / totalWaves) + (waveIndex === 0 ? (config.elite || 0) % totalWaves : 0)
        };

        this.spawnTimer = 0;
        this.spawnDelay = (1500 + Math.random() * 1000) * this.spawnRateMultiplier;
    }

    startBossWave() {
        this.waveNumber = 1;
        this.waveInProgress = true;
        this.enemiesToSpawn = { basic: 0, fast: 0, tank: 0, elite: 0 };
        
        // Spawn boss
        this.spawnBoss();
    }

    spawnBoss() {
        // Boss positions are usually center or far from player
        const pos = { x: 400, y: 150 }; // Top center for boss
        
        // Create boss enemy (we'll implement Boss class in enemy.js or boss.js)
        // For now, let's use a very strong Tank enemy with an elite tag
        const boss = new Enemy(pos.x, pos.y, 'tank');
        boss.isBoss = true;
        boss.radius = 40;
        boss.maxHealth = 500 * (1 + (this.currentLevel / 5) * 0.5);
        boss.health = boss.maxHealth;
        boss.speed = 80;
        boss.scoreValue = 1000 * this.currentLevel;
        boss.color = '#ff0000';
        
        this.game.enemies.push(boss);
    }

    update(deltaTime) {
        // Handle level transition screen
        if (this.showingLevelScreen) {
            this.levelTransitionTimer -= deltaTime;
            if (this.levelTransitionTimer <= 0) {
                this.showingLevelScreen = false;
            }
            return;
        }

        if (!this.waveInProgress) return;

        // Spawn enemies
        const totalRemaining = this.enemiesToSpawn.basic + this.enemiesToSpawn.fast + this.enemiesToSpawn.tank + (this.enemiesToSpawn.elite || 0);

        if (totalRemaining > 0) {
            this.spawnTimer -= deltaTime;

            if (this.spawnTimer <= 0) {
                this.spawnEnemy();
                this.spawnTimer = (1000 + Math.random() * 1500) * this.spawnRateMultiplier;
            }
        } else if (this.game.enemies.length === 0) {
            // Wave complete
            const config = this.waveConfig[this.currentLevel];
            if (!config.boss && this.waveNumber < 3) {
                // Start next wave
                setTimeout(() => {
                    this.startWave(this.waveNumber + 1);
                }, 2000);
            } else {
                // Level complete
                if (this.currentLevel < this.maxLevel) {
                    setTimeout(() => {
                        this.startLevel(this.currentLevel + 1);
                    }, 2000);
                } else {
                    // Game complete - victory!
                    this.game.state = 'VICTORY';
                }
            }
            this.waveInProgress = false;
        }
    }

    spawnEnemy() {
        // Pick enemy type
        const types = [];
        if (this.enemiesToSpawn.basic > 0) types.push('basic');
        if (this.enemiesToSpawn.fast > 0) types.push('fast');
        if (this.enemiesToSpawn.tank > 0) types.push('tank');
        if (this.enemiesToSpawn.elite > 0) types.push('elite');

        if (types.length === 0) return;

        const type = types[Math.floor(Math.random() * types.length)];
        this.enemiesToSpawn[type === 'elite' ? 'elite' : type]--;

        // Get spawn position from tilemap (away from player)
        let pos = { x: 100, y: 100 };
        if (this.game.tileMap && this.game.player) {
            const positions = this.game.tileMap.getSpawnPositions(this.game.player.x, this.game.player.y, 1);
            if (positions.length > 0) {
                pos = positions[0];
            }
        }

        // Create enemy with scaled stats
        const actualType = type === 'elite' ? (Math.random() > 0.5 ? 'fast' : 'tank') : type;
        const enemy = new Enemy(pos.x, pos.y, actualType);
        
        if (type === 'elite') {
            enemy.isElite = true;
            enemy.maxHealth *= 2;
            enemy.speed *= 1.3;
            enemy.scoreValue *= 3;
        }

        enemy.maxHealth = Math.floor(enemy.maxHealth * this.enemyHealthMultiplier);
        enemy.health = enemy.maxHealth;
        enemy.speed = enemy.speed * this.enemySpeedMultiplier;

        this.game.enemies.push(enemy);
    }

    render(ctx) {
        // Draw level transition screen
        if (this.showingLevelScreen) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, 800, 600);

            ctx.fillStyle = '#00ff00';
            ctx.font = '36px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText(`LEVEL ${this.currentLevel}`, 400, 200);

            const config = this.waveConfig[this.currentLevel];
            
            if (config.boss) {
                ctx.fillStyle = '#ff0000';
                ctx.font = '24px "Press Start 2P"';
                ctx.fillText('BOSS LEVEL', 400, 300);
                ctx.fillStyle = '#fff';
                ctx.fillText(config.theme, 400, 350);
            } else {
                ctx.fillStyle = '#fff';
                ctx.font = '16px "Press Start 2P"';

                // Show enemy types for this level
                let y = 300;

                if (config.basic > 0) {
                    ctx.fillStyle = '#ff4444';
                    ctx.fillText(`${config.basic}x Basic Enemies`, 400, y);
                    y += 30;
                }
                if (config.fast > 0) {
                    ctx.fillStyle = '#ff00ff';
                    ctx.fillText(`${config.fast}x Fast Enemies`, 400, y);
                    y += 30;
                }
                if (config.tank > 0) {
                    ctx.fillStyle = '#ff8800';
                    ctx.fillText(`${config.tank}x Tank Enemies`, 400, y);
                    y += 30;
                }
                if (config.elite > 0) {
                    ctx.fillStyle = '#ffff00';
                    ctx.fillText(`${config.elite}x Elite Enemies`, 400, y);
                }
            }

            ctx.fillStyle = '#888';
            ctx.font = '12px "Press Start 2P"';
            ctx.fillText('Get Ready!', 400, 500);

            ctx.textAlign = 'left';
        }
    }

    renderWaveInfo(ctx) {
        if (!this.waveInProgress || this.showingLevelScreen) return;

        const config = this.waveConfig[this.currentLevel];
        if (config.boss) {
            ctx.fillStyle = '#ff0000';
            ctx.font = '12px "Press Start 2P"';
            ctx.fillText('BOSS WAVE', 680, 65);
            return;
        }

        // Show wave progress
        const totalRemaining = this.enemiesToSpawn.basic + this.enemiesToSpawn.fast + this.enemiesToSpawn.tank + (this.enemiesToSpawn.elite || 0);

        ctx.fillStyle = '#fff';
        ctx.font = '12px "Press Start 2P"';
        ctx.fillText(`WAVE ${this.waveNumber}/3`, 680, 65);
        ctx.fillText(`REMAINING: ${totalRemaining + this.game.enemies.length}`, 680, 85);
    }
}
