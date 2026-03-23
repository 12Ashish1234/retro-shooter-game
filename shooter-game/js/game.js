class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 600;

        // Persistent background canvas for blood splatter
        this.bgCanvas = document.createElement('canvas');
        this.bgCanvas.width = 800;
        this.bgCanvas.height = 600;
        this.bgCtx = this.bgCanvas.getContext('2d');

        // Game state
        this.state = 'MENU';
        this.previousState = null;
        this.lastTime = 0;
        this.deltaTime = 0;

        // Game objects
        this.player = null;
        this.enemies = [];
        this.particles = new ParticleSystem();
        this.levelManager = new LevelManager(this);
        this.tileMap = null;
        this.powerUpManager = null;
        this.comboSystem = new ComboSystem();

        // Score
        this.score = 0;

        // Screen shake
        this.screenShake = 0;
        this.cameraOffset = { x: 0, y: 0 };

        // Initialize
        Input.init(this.canvas);
        Audio.init();
        this.setupUI();
        this.setupPauseKey();

        // Start game loop
        requestAnimationFrame((t) => this.loop(t));
    }

    setupUI() {
        const startBtn = document.getElementById('start-btn');
        const instructionsBtn = document.getElementById('instructions-btn');
        const backBtn = document.getElementById('back-btn');
        const resumeBtn = document.getElementById('resume-btn');
        const quitBtn = document.getElementById('quit-btn');
        const menuScreen = document.getElementById('menu-screen');
        const instructionsScreen = document.getElementById('instructions-screen');
        const pauseScreen = document.getElementById('pause-screen');

        startBtn.addEventListener('click', () => {
            this.startGame();
        });

        instructionsBtn.addEventListener('click', () => {
            menuScreen.classList.remove('active');
            instructionsScreen.classList.add('active');
        });

        backBtn.addEventListener('click', () => {
            instructionsScreen.classList.remove('active');
            menuScreen.classList.add('active');
        });

        resumeBtn.addEventListener('click', () => {
            this.resumeGame();
        });

        quitBtn.addEventListener('click', () => {
            this.quitToMenu();
        });
    }

    setupPauseKey() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') {
                if (this.state === 'PLAYING') {
                    this.pauseGame();
                } else if (this.state === 'PAUSED') {
                    this.resumeGame();
                }
            }
        });
    }

    startGame() {
        this.state = 'PLAYING';
        this.score = 0;
        this.screenShake = 0;
        document.getElementById('menu-screen').classList.remove('active');
        document.getElementById('instructions-screen').classList.remove('active');
        document.getElementById('pause-screen').classList.remove('active');

        // Clear blood
        this.bgCtx.clearRect(0, 0, 800, 600);

        // Resume audio context if suspended
        if (Audio.ctx && Audio.ctx.state === 'suspended') {
            Audio.ctx.resume();
        }

        // Create tilemap for level 1
        this.tileMap = new TileMap(25, 19, 32); // 800/32 = 25, 600/32 = 18.75
        this.tileMap.generateLevel(1);

        // Create player at center (find clear spot)
        this.player = new Player(400, 300);
        this.player.particles = this.particles;
        this.player.tileMap = this.tileMap;
        this.player.game = this; // Reference for multi-shot

        // Create powerup manager
        this.powerUpManager = new PowerUpManager(this.player);
        
        // Reset Combo System
        this.comboSystem.reset();

        // Clear existing enemies
        this.enemies = [];

        // Start level 1
        this.levelManager = new LevelManager(this);
        this.levelManager.startLevel(1);

        // Play level up sound
        Audio.playLevelUp();
    }

    pauseGame() {
        this.previousState = this.state;
        this.state = 'PAUSED';
        document.getElementById('pause-screen').classList.add('active');
    }

    resumeGame() {
        this.state = this.previousState || 'PLAYING';
        document.getElementById('pause-screen').classList.remove('active');
    }

    quitToMenu() {
        this.state = 'MENU';
        this.previousState = null;
        document.getElementById('pause-screen').classList.remove('active');
        document.getElementById('menu-screen').classList.add('active');
    }

    addScreenShake(amount) {
        this.screenShake = Math.min(this.screenShake + amount, 20);
    }

    addBloodSplatter(x, y, color = '#aa0000', size = 1) {
        this.bgCtx.fillStyle = color;
        for (let i = 0; i < 5; i++) {
            const bx = x + (Math.random() - 0.5) * 40;
            const by = y + (Math.random() - 0.5) * 40;
            const bs = (Math.random() * 4 + 2) * size;
            this.bgCtx.beginPath();
            this.bgCtx.arc(bx, by, bs, 0, Math.PI * 2);
            this.bgCtx.fill();
        }
    }

    update(deltaTime) {
        if (this.state === 'PAUSED') return;
        if (this.state !== 'PLAYING' && this.state !== 'VICTORY') return;

        // Update screen shake
        if (this.screenShake > 0) {
            this.cameraOffset.x = (Math.random() - 0.5) * this.screenShake;
            this.cameraOffset.y = (Math.random() - 0.5) * this.screenShake;
            this.screenShake *= 0.9; // Decay
            if (this.screenShake < 0.5) {
                this.screenShake = 0;
                this.cameraOffset.x = 0;
                this.cameraOffset.y = 0;
            }
        }

        // Update level manager (handles spawning)
        this.levelManager.update(deltaTime);

        // Update tilemap (mark visited for minimap)
        if (this.tileMap && this.player) {
            this.tileMap.markVisited(this.player.x, this.player.y, 150);
        }

        // Update player
        if (this.player) {
            this.player.update(deltaTime, Input);
        }

        // Update powerups
        if (this.powerUpManager) {
            this.powerUpManager.update(deltaTime);
        }
        
        // Update combo system
        this.comboSystem.update(deltaTime);

        // Update enemies
        this.enemies.forEach(enemy => {
            if (enemy.isActive && this.player) {
                enemy.update(deltaTime, this.player);
                // Mark minimap for enemies
                if (this.tileMap) {
                    this.tileMap.markVisited(enemy.x, enemy.y, 50);
                }
            }
        });

        // Update particles
        this.particles.update(deltaTime);

        // Check collisions
        this.checkCollisions();

        // Remove dead enemies
        this.enemies = this.enemies.filter(enemy => {
            if (!enemy.isActive) {
                // Create death explosion
                this.particles.createExplosion(enemy.x, enemy.y,
                    enemy.isBoss ? 'large' : enemy.isElite ? 'medium' : 'small');
                
                // Add to score with combo multiplier
                this.score += enemy.scoreValue * this.comboSystem.getScoreMultiplier();
                
                // Add to combo
                this.comboSystem.addKill();

                // Play explosion sound
                Audio.playExplosion(enemy.isBoss ? 'large' : enemy.isElite ? 'medium' : 'small');

                // Persistent blood
                this.addBloodSplatter(enemy.x, enemy.y, enemy.color, enemy.isBoss ? 2 : 1);

                // Spawn powerup (chance-based inside manager)
                if (this.powerUpManager) {
                    this.powerUpManager.spawn(enemy.x, enemy.y);
                }
            }
            return enemy.isActive;
        });
    }

    checkCollisions() {
        if (!this.player) return;

        // Bullet vs Enemy collisions
        this.player.bullets.forEach(bullet => {
            if (!bullet.isActive) return;

            // Check wall collision
            if (this.tileMap && this.tileMap.blocksBullet(bullet.x, bullet.y)) {
                bullet.isActive = false;
                this.particles.createHitSpark(bullet.x, bullet.y);
                return;
            }

            this.enemies.forEach(enemy => {
                if (!enemy.isActive) return;

                // Simple circle collision
                const dist = Utils.distance(bullet.x, bullet.y, enemy.x, enemy.y);
                if (dist < enemy.radius + bullet.radius) {
                    // Hit!
                    bullet.isActive = false;

                    // Damage enemy
                    let damage = bullet.damage || 12;
                    if (this.powerUpManager && this.powerUpManager.isDamageBoost()) {
                        damage *= 2;
                    }
                    const died = enemy.takeDamage(damage);

                    // Screen shake on hit
                    this.addScreenShake(enemy.isBoss ? 8 : 3);

                    // Play hit sound
                    Audio.playHit();

                    // Create hit effects
                    this.particles.createHitSpark(bullet.x, bullet.y);
                    this.particles.createBloodSplatter(bullet.x, bullet.y, 5);
                }
            });
        });

        // Enemy vs Player collisions
        this.enemies.forEach(enemy => {
            if (!enemy.isActive) return;

            const dist = Utils.distance(this.player.x, this.player.y, enemy.x, enemy.y);
            if (dist < enemy.radius + this.player.width / 2) {
                // Player takes damage (unless shielded)
                if (this.powerUpManager && this.powerUpManager.isShield()) {
                    // Just push back, no damage
                    this.addScreenShake(2);
                } else {
                    this.player.takeDamage(enemy.isBoss ? 25 : 10);
                    // Screen shake on damage
                    this.addScreenShake(enemy.isBoss ? 15 : 8);
                    // Play damage sound
                    Audio.playDamage();
                    // Visual feedback
                    this.particles.createBloodSplatter(this.player.x, this.player.y, 3);
                }

                // Push enemy back
                const angle = Utils.angleBetween(enemy.x, enemy.y, this.player.x, this.player.y);
                enemy.x -= Math.cos(angle) * (enemy.isBoss ? 10 : 30);
                enemy.y -= Math.sin(angle) * (enemy.isBoss ? 10 : 30);

                // Check game over
                if (this.player.health <= 0) {
                    this.state = 'GAMEOVER';
                }
            }
        });
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Apply camera offset for screen shake
        this.ctx.save();
        this.ctx.translate(this.cameraOffset.x, this.cameraOffset.y);

        // Render persistent blood/bg
        this.ctx.drawImage(this.bgCanvas, 0, 0);

        // Render tilemap
        if (this.tileMap && this.player) {
            this.tileMap.render(this.ctx, 0, 0, this.player.x, this.player.y);
        }

        if (this.state === 'PLAYING' || this.state === 'GAMEOVER' || this.state === 'VICTORY' || this.state === 'PAUSED') {
            // Render level transition screen if showing
            this.levelManager.render(this.ctx);

            // Render particles (behind entities)
            this.particles.render(this.ctx);

            // Render powerups
            if (this.powerUpManager) {
                this.powerUpManager.render(this.ctx);
            }

            // Render enemies
            this.enemies.forEach(enemy => enemy.render(this.ctx));

            // Render player
            if (this.player) {
                this.player.render(this.ctx);
            }

            // Draw crosshair at mouse position
            this.drawCrosshair();

            // Draw HUD
            this.drawHUD();
            
            // Draw combo
            this.comboSystem.render(this.ctx);
            
            // Draw weapon UI
            if (this.player && this.player.weaponSystem) {
                this.player.weaponSystem.renderUI(this.ctx);
            }

            // Draw wave info
            this.levelManager.renderWaveInfo(this.ctx);

            // Draw minimap
            if (this.tileMap && this.player) {
                this.tileMap.renderMinimap(this.ctx, this.player.x, this.player.y);
                // Draw enemies on minimap
                this.enemies.forEach(enemy => {
                    if (enemy.isActive) {
                        const ex = Math.floor(enemy.x / 32);
                        const ey = Math.floor(enemy.y / 32);
                        const mapX = 800 - (25 * 4) - 20 + ex * 4;
                        const mapY = 20 + ey * 4;
                        this.ctx.fillStyle = enemy.isBoss ? '#f0f' : '#f00';
                        this.ctx.fillRect(mapX - 1, mapY - 1, 3, 3);
                    }
                });
            }
        }

        this.ctx.restore();

        if (this.state === 'GAMEOVER') {
            this.drawGameOver();
        }

        if (this.state === 'VICTORY') {
            this.drawVictory();
        }
    }

    drawCrosshair() {
        const mouse = Input.getMousePos();
        const size = 12;

        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;

        // Draw crosshair lines
        this.ctx.beginPath();
        // Top
        this.ctx.moveTo(mouse.x, mouse.y - size - 4);
        this.ctx.lineTo(mouse.x, mouse.y - 4);
        // Bottom
        this.ctx.moveTo(mouse.x, mouse.y + 4);
        this.ctx.lineTo(mouse.x, mouse.y + size + 4);
        // Left
        this.ctx.moveTo(mouse.x - size - 4, mouse.y);
        this.ctx.lineTo(mouse.x - 4, mouse.y);
        // Right
        this.ctx.moveTo(mouse.x + 4, mouse.y);
        this.ctx.lineTo(mouse.x + size + 4, mouse.y);
        this.ctx.stroke();

        // Center dot
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(mouse.x - 2, mouse.y - 2, 4, 4);
    }

    drawHUD() {
        if (!this.player) return;

        // Health bar with style
        const barWidth = 200;
        const barHeight = 20;
        const healthPercent = this.player.health / this.player.maxHealth;

        // Bar background
        this.ctx.fillStyle = '#220000';
        this.ctx.fillRect(20, 20, barWidth, barHeight);

        // Health fill with gradient effect
        let healthColor = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';

        // Pulsing effect when low health
        if (healthPercent <= 0.25) {
            const pulse = (Math.sin(Date.now() / 200) + 1) / 2;
            healthColor = pulse > 0.5 ? '#ff0000' : '#aa0000';
        }

        this.ctx.fillStyle = healthColor;
        this.ctx.fillRect(22, 22, (barWidth - 4) * healthPercent, barHeight - 4);

        // Bar border
        this.ctx.strokeStyle = healthPercent <= 0.25 ? '#ff0000' : '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(20, 20, barWidth, barHeight);

        // Health text
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px "Press Start 2P"';
        this.ctx.fillText('HP', 20, 18);
        this.ctx.fillText(`${Math.ceil(this.player.health)}/${this.player.maxHealth}`, barWidth + 30, 35);

        // Score
        this.ctx.fillText(`SCORE: ${this.score}`, 20, 65);

        // Level
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillText(`LEVEL: ${this.levelManager.currentLevel}`, 20, 90);

        // Pause hint
        this.ctx.fillStyle = '#666';
        this.ctx.font = '10px "Press Start 2P"';
        this.ctx.fillText('ESC to pause', 20, 115);

        // Low health warning
        if (healthPercent <= 0.25) {
            this.ctx.fillStyle = `rgba(255, 0, 0, ${0.3 + (Math.sin(Date.now() / 200) + 1) / 4})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    drawGameOver() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Scanline effect
        this.drawScanlines();

        this.ctx.fillStyle = '#ff0000';
        this.ctx.font = '48px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 80);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px "Press Start 2P"';
        this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText(`Level Reached: ${this.levelManager.currentLevel}`, this.canvas.width / 2, this.canvas.height / 2 + 40);

        this.ctx.fillStyle = '#ffff00';
        this.ctx.font = '14px "Press Start 2P"';
        this.ctx.fillText('Click to return to menu', this.canvas.width / 2, this.canvas.height / 2 + 100);

        this.ctx.textAlign = 'left';

        // Return to menu on click
        if (Input.isMouseDown()) {
            this.state = 'MENU';
            document.getElementById('menu-screen').classList.add('active');
        }
    }

    drawVictory() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Scanline effect
        this.drawScanlines();

        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '48px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('VICTORY!', this.canvas.width / 2, this.canvas.height / 2 - 80);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px "Press Start 2P"';
        this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText(`You conquered all ${this.levelManager.maxLevel} levels!`, this.canvas.width / 2, this.canvas.height / 2 + 40);

        this.ctx.fillStyle = '#ffff00';
        this.ctx.font = '14px "Press Start 2P"';
        this.ctx.fillText('Click to return to menu', this.canvas.width / 2, this.canvas.height / 2 + 100);

        this.ctx.textAlign = 'left';

        // Return to menu on click
        if (Input.isMouseDown()) {
            this.state = 'MENU';
            document.getElementById('menu-screen').classList.add('active');
        }
    }

    drawScanlines() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        for (let y = 0; y < this.canvas.height; y += 4) {
            this.ctx.fillRect(0, y, this.canvas.width, 2);
        }
    }

    loop(timestamp) {
        // Calculate delta time
        this.deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // Update and render
        this.update(this.deltaTime);
        this.render();

        // Continue loop
        requestAnimationFrame((t) => this.loop(t));
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new Game();
});
