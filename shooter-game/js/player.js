class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.speed = 200; // pixels per second
        this.velocity = { x: 0, y: 0 };

        // Health
        this.maxHealth = 100;
        this.health = this.maxHealth;

        // Animation
        this.animTimer = 0;
        this.animFrame = 0;
        this.isMoving = false;
        this.facingAngle = 0;

        // Gun
        this.gunOffset = { x: 12, y: 8 };
        this.gunLength = 18;
        this.gunRecoil = 0;
        this.maxRecoil = 6;

        // Shooting
        this.shootCooldown = 0;
        this.shootDelay = 120; // ms between shots
        this.bullets = [];

        // Reference to particle system and tilemap (set by game)
        this.particles = null;
        this.tileMap = null;
        this.game = null;

        // Weapon System
        this.weaponSystem = new WeaponSystem(this);

        // Terrain effects
        this.speedMultiplier = 1;
        this.lavaDamageTimer = 0;
        this.footstepTimer = 0;
    }

    update(deltaTime, input) {
        // Reset velocity
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.isMoving = false;

        // Movement input
        if (input.isKeyDown('ArrowUp') || input.isKeyDown('KeyW')) {
            this.velocity.y = -1;
            this.isMoving = true;
        }
        if (input.isKeyDown('ArrowDown') || input.isKeyDown('KeyS')) {
            this.velocity.y = 1;
            this.isMoving = true;
        }
        if (input.isKeyDown('ArrowLeft') || input.isKeyDown('KeyA')) {
            this.velocity.x = -1;
            this.isMoving = true;
        }
        if (input.isKeyDown('ArrowRight') || input.isKeyDown('KeyD')) {
            this.velocity.x = 1;
            this.isMoving = true;
        }

        // Normalize diagonal movement
        const mag = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        if (mag > 0) {
            this.velocity.x = (this.velocity.x / mag) * this.speed * this.speedMultiplier * (deltaTime / 1000);
            this.velocity.y = (this.velocity.y / mag) * this.speed * this.speedMultiplier * (deltaTime / 1000);
        }

        // Footstep particles
        if (this.isMoving) {
            this.footstepTimer -= deltaTime;
            if (this.footstepTimer <= 0) {
                if (this.particles) {
                    this.particles.createFootstep(this.x, this.y + 10);
                }
                this.footstepTimer = 200;
            }
        }

        // Check terrain at current position
        if (this.tileMap) {
            // Apply speed penalty for water
            if (this.tileMap.slowsMovement(this.x, this.y)) {
                this.speedMultiplier = 0.6;
            } else {
                this.speedMultiplier = 1;
            }

            // Apply lava damage
            if (this.tileMap.damagesPlayer(this.x, this.y)) {
                this.lavaDamageTimer -= deltaTime;
                if (this.lavaDamageTimer <= 0) {
                    this.takeDamage(5);
                    this.lavaDamageTimer = 500; // Damage every 500ms
                    // Visual feedback
                    if (this.particles) {
                        this.particles.createHitSpark(this.x, this.y);
                    }
                }
            } else {
                this.lavaDamageTimer = 0;
            }
        }

        // Try to move X axis
        const nextX = this.x + this.velocity.x;
        if (this.tileMap && !this.tileMap.isWalkable(nextX, this.y)) {
            // Hit wall on X, try to slide
            if (this.tileMap.isWalkable(this.x, this.y + this.velocity.y)) {
                // Can only move Y
                this.x = this.x;
            }
        } else {
            this.x = nextX;
        }

        // Try to move Y axis
        const nextY = this.y + this.velocity.y;
        if (this.tileMap && !this.tileMap.isWalkable(this.x, nextY)) {
            // Hit wall on Y
            this.y = this.y;
        } else {
            this.y = nextY;
        }

        // Clamp to canvas bounds
        this.x = Utils.clamp(this.x, this.width / 2, 800 - this.width / 2);
        this.y = Utils.clamp(this.y, this.height / 2, 600 - this.height / 2);

        // Calculate angle to mouse
        const mouse = input.getMousePos();
        this.facingAngle = Utils.angleBetween(this.x, this.y, mouse.x, mouse.y);

        // Animation
        this.animTimer += deltaTime;
        if (this.isMoving) {
            if (this.animTimer > 150) {
                this.animFrame = (this.animFrame + 1) % 4;
                this.animTimer = 0;
            }
        } else {
            this.animFrame = 0;
        }

        // Weapon switch input
        if (input.isKeyDown('Digit1')) this.weaponSystem.switchWeapon('pistol');
        if (input.isKeyDown('Digit2')) this.weaponSystem.switchWeapon('shotgun');
        if (input.isKeyDown('Digit3')) this.weaponSystem.switchWeapon('laser');

        // Update weapon system
        this.weaponSystem.update(deltaTime);

        // Gun recoil recovery
        if (this.gunRecoil > 0) {
            this.gunRecoil = Math.max(0, this.gunRecoil - deltaTime * 0.02);
        }

        // Shooting cooldown
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }

        // Shooting
        if (input.isMouseDown() && this.shootCooldown <= 0) {
            this.shoot();
        }

        // Update bullets
        this.bullets.forEach(bullet => bullet.update(deltaTime));
        this.bullets = this.bullets.filter(bullet => bullet.isActive);
    }

    shoot() {
        const weapon = this.weaponSystem.getCurrent();
        
        // Check ammo
        if (weapon.ammo <= 0 && weapon.ammo !== Infinity) return;

        // Calculate gun tip position
        const recoilOffset = this.gunRecoil;
        const gunTipX = this.x + Math.cos(this.facingAngle) * (this.gunLength - recoilOffset);
        const gunTipY = this.y + Math.sin(this.facingAngle) * (this.gunLength - recoilOffset);

        // Shooting logic based on weapon type
        if (weapon.type === 'shotgun') {
            for (let i = 0; i < weapon.pellets; i++) {
                const spreadAngle = this.facingAngle + (Math.random() - 0.5) * weapon.spread;
                const bullet = new Bullet(gunTipX, gunTipY, spreadAngle);
                bullet.speed = weapon.bulletSpeed * (0.9 + Math.random() * 0.2);
                this.bullets.push(bullet);
            }
            weapon.ammo--;
            if (this.particles) this.particles.createCasing(this.x, this.y, this.facingAngle);
        } else if (weapon.type === 'laser') {
            const bullet = new Bullet(gunTipX, gunTipY, this.facingAngle);
            bullet.speed = weapon.bulletSpeed;
            bullet.damage = weapon.damage;
            this.bullets.push(bullet);
            weapon.ammo--;
        } else {
            // Pistol or multi-shot powerup
            if (this.game && this.game.powerUpManager && this.game.powerUpManager.isMultiShot()) {
                const spread = 0.2;
                for (let i = -1; i <= 1; i++) {
                    const angle = this.facingAngle + (i * spread);
                    const bullet = new Bullet(gunTipX, gunTipY, angle);
                    bullet.speed = weapon.bulletSpeed;
                    this.bullets.push(bullet);
                }
            } else {
                const bullet = new Bullet(gunTipX, gunTipY, this.facingAngle);
                bullet.speed = weapon.bulletSpeed;
                this.bullets.push(bullet);
            }
            if (this.particles) this.particles.createCasing(this.x, this.y, this.facingAngle);
        }

        // Play shoot sound
        Audio.playShoot();

        // Muzzle flash effect
        if (this.particles) {
            this.particles.createMuzzleFlash(gunTipX, gunTipY, this.facingAngle);
        }

        // Apply recoil
        this.gunRecoil = weapon.recoil;

        // Reset cooldown
        this.shootCooldown = weapon.shootDelay;
        
        // Multi-shot and Rapid Fire powerups affect this
        if (this.game && this.game.powerUpManager && this.game.powerUpManager.isRapidFire()) {
            this.shootCooldown /= 2;
        }
    }

    render(ctx) {
        // Render bullets
        this.bullets.forEach(bullet => bullet.render(ctx));

        ctx.save();
        ctx.translate(this.x, this.y);

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 14, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body bobbing animation
        const bobOffset = this.isMoving ? Math.sin(this.animFrame * Math.PI / 2) * 2 : 0;

        // Body (green square with pixel style)
        ctx.fillStyle = '#00aa00';
        ctx.fillRect(-14, -14 + bobOffset, 28, 28);

        // Body border
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(-14, -14 + bobOffset, 28, 28);

        // Head (darker green, also bobs)
        ctx.fillStyle = '#008800';
        ctx.fillRect(-10, -10 + bobOffset, 20, 20);

        // Head highlight
        ctx.fillStyle = '#00cc00';
        ctx.fillRect(-6, -6 + bobOffset, 4, 4);

        ctx.restore();

        // Gun (rendered separately to rotate smoothly)
        this.renderGun(ctx, bobOffset);
    }

    renderGun(ctx, bobOffset) {
        ctx.save();
        ctx.translate(this.x, this.y + bobOffset);
        ctx.rotate(this.facingAngle);

        const weapon = this.weaponSystem.getCurrent();
        
        // Gun body based on weapon
        if (weapon.type === 'shotgun') {
            ctx.fillStyle = '#555';
            ctx.fillRect(8, -5, 22, 10);
            ctx.fillStyle = '#333';
            ctx.fillRect(12, -4, 20, 8);
        } else if (weapon.type === 'laser') {
            ctx.fillStyle = '#0088ff';
            ctx.fillRect(8, -4, 25, 8);
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(28, -2, 5, 4);
        } else {
            ctx.fillStyle = '#444';
            ctx.fillRect(8, -3, 18, 6);
            ctx.fillStyle = '#222';
            ctx.fillRect(12, -2, 14, 4);
        }

        // Muzzle position indicator (for debug/visual)
        const recoilOffset = this.gunRecoil;
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.arc(this.gunLength + 10 - recoilOffset, 0, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
    }
}
