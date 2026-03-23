class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 12;
        this.isActive = true;
        this.bobOffset = 0;
        this.bobSpeed = 0.005;
        this.bobTime = Math.random() * Math.PI * 2;

        // Magnet effect
        this.magnetRange = 80;
        this.magnetSpeed = 300;

        // Visual properties
        this.pulseScale = 1;
        this.pulseSpeed = 0.003;
        this.pulseTime = 0;

        // Colors by type
        this.colors = {
            rapidFire: '#00ff00',    // Green
            damageBoost: '#ff0000',  // Red
            speedBoost: '#0088ff',   // Blue
            multiShot: '#ffff00',    // Yellow
            shield: '#00ffff',       // Cyan
            health: '#ffffff'        // White
        };

        this.color = this.colors[type] || '#ffffff';
    }

    update(deltaTime, player) {
        if (!this.isActive) return;

        // Bobbing animation
        this.bobTime += deltaTime * this.bobSpeed;
        this.bobOffset = Math.sin(this.bobTime) * 3;

        // Pulsing glow
        this.pulseTime += deltaTime * this.pulseSpeed;
        this.pulseScale = 1 + Math.sin(this.pulseTime) * 0.15;

        // Magnet effect - pull toward player if close
        const dist = Utils.distance(this.x, this.y, player.x, player.y);
        if (dist < this.magnetRange && dist > this.radius + player.width / 2) {
            const angle = Utils.angleBetween(this.x, this.y, player.x, player.y);
            const moveSpeed = this.magnetSpeed * (1 - dist / this.magnetRange); // Faster as closer
            this.x += Math.cos(angle) * moveSpeed * (deltaTime / 1000);
            this.y += Math.sin(angle) * moveSpeed * (deltaTime / 1000);
        }

        // Check pickup
        if (dist < this.radius + player.width / 2) {
            return true; // Picked up
        }

        return false;
    }

    render(ctx) {
        if (!this.isActive) return;

        const x = this.x;
        const y = this.y + this.bobOffset;

        // Outer glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, this.radius * 2 * this.pulseScale);
        gradient.addColorStop(0, this.color + '40');
        gradient.addColorStop(0.5, this.color + '20');
        gradient.addColorStop(1, this.color + '00');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, this.radius * 2 * this.pulseScale, 0, Math.PI * 2);
        ctx.fill();

        // Main body
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(x, y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner colored circle
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(x, y, this.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Shine/highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(x - 3, y - 3, 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw icon based on type
        ctx.fillStyle = '#000';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let icon = '?';
        switch (this.type) {
            case 'rapidFire': icon = '⚡'; break;
            case 'damageBoost': icon = '⚔️'; break;
            case 'speedBoost': icon = '👟'; break;
            case 'multiShot': icon = '☢️'; break;
            case 'shield': icon = '🛡️'; break;
            case 'health': icon = '❤️'; break;
        }

        ctx.fillText(icon, x, y + 1);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }
}

class PowerUpManager {
    constructor(player) {
        this.player = player;
        this.powerups = [];
        this.activeEffects = {};

        // Effect durations (ms)
        this.durations = {
            rapidFire: 10000,    // 10 seconds
            damageBoost: 10000,
            speedBoost: 8000,
            multiShot: 8000,
            shield: 5000
        };

        // Store original values
        this.originalValues = {
            shootDelay: player ? player.shootDelay : 120,
            speed: player ? player.speed : 200,
            damageMultiplier: 1
        };
    }

    spawn(x, y) {
        // 25% chance to spawn a powerup
        if (Math.random() > 0.25) return;

        // Random type
        const types = ['rapidFire', 'damageBoost', 'speedBoost', 'multiShot', 'shield', 'health'];
        const type = types[Math.floor(Math.random() * types.length)];

        const powerup = new PowerUp(x, y, type);
        this.powerups.push(powerup);
    }

    update(deltaTime) {
        // Update all powerups
        this.powerups = this.powerups.filter(powerup => {
            if (!powerup.isActive) return false;

            const pickedUp = powerup.update(deltaTime, this.player);

            if (pickedUp) {
                this.applyEffect(powerup.type);
                return false; // Remove from array
            }

            return true;
        });

        // Update active effects
        for (const type in this.activeEffects) {
            this.activeEffects[type] -= deltaTime;
            if (this.activeEffects[type] <= 0) {
                this.removeEffect(type);
                delete this.activeEffects[type];
            }
        }
    }

    applyEffect(type) {
        // Play sound
        if (typeof Audio !== 'undefined' && Audio.playLevelUp) {
            Audio.playLevelUp(); // Reuse level up sound for now
        }

        switch (type) {
            case 'rapidFire':
                this.activeEffects.rapidFire = this.durations.rapidFire;
                break;

            case 'damageBoost':
                this.activeEffects.damageBoost = this.durations.damageBoost;
                break;

            case 'speedBoost':
                this.activeEffects.speedBoost = this.durations.speedBoost;
                this.player.speed = this.originalValues.speed * 1.5;
                break;

            case 'multiShot':
                this.activeEffects.multiShot = this.durations.multiShot;
                // Also give some shotgun ammo
                if (this.player.weaponSystem) {
                    this.player.weaponSystem.addAmmo('shotgun', 10);
                }
                break;

            case 'shield':
                this.activeEffects.shield = this.durations.shield;
                break;

            case 'health':
                this.player.health = Math.min(this.player.health + 25, this.player.maxHealth);
                // Create healing particles
                if (this.player.particles) {
                    for (let i = 0; i < 8; i++) {
                        const angle = (Math.PI * 2 / 8) * i;
                        this.player.particles.add(
                            this.player.x, this.player.y,
                            Math.cos(angle) * 50, Math.sin(angle) * 50,
                            '#00ff00', 4, 500
                        );
                    }
                }
                break;
        }

        // Randomly give laser ammo on any powerup pickup
        if (this.player.weaponSystem && Math.random() > 0.5) {
            this.player.weaponSystem.addAmmo('laser', 50);
        }
    }

    removeEffect(type) {
        switch (type) {
            case 'rapidFire':
                this.player.shootDelay = this.originalValues.shootDelay;
                break;

            case 'damageBoost':
                // Reset in collision check
                break;

            case 'speedBoost':
                this.player.speed = this.originalValues.speed;
                break;

            case 'multiShot':
                // Just ends - shooting logic checks this
                break;

            case 'shield':
                // Just ends - damage logic checks this
                break;
        }
    }

    // Getters for checking active effects
    isRapidFire() { return this.activeEffects.rapidFire > 0; }
    isDamageBoost() { return this.activeEffects.damageBoost > 0; }
    isSpeedBoost() { return this.activeEffects.speedBoost > 0; }
    isMultiShot() { return this.activeEffects.multiShot > 0; }
    isShield() { return this.activeEffects.shield > 0; }

    getEffectTimeRemaining(type) {
        return Math.max(0, this.activeEffects[type] || 0);
    }

    getAllActiveEffects() {
        const effects = [];
        for (const type in this.activeEffects) {
            effects.push({
                type: type,
                timeRemaining: this.activeEffects[type],
                duration: this.durations[type]
            });
        }
        return effects;
    }

    render(ctx) {
        // Render all powerups on ground
        this.powerups.forEach(powerup => powerup.render(ctx));

        // Draw active effects UI
        this.renderActiveEffects(ctx);
    }

    renderActiveEffects(ctx) {
        const effects = this.getAllActiveEffects();
        if (effects.length === 0) return;

        const startX = 20;
        const startY = 140;
        const iconSize = 30;
        const spacing = 40;

        ctx.save();

        effects.forEach((effect, index) => {
            const x = startX + (index * spacing);
            const y = startY;
            const progress = effect.timeRemaining / effect.duration;

            // Background
            ctx.fillStyle = '#222';
            ctx.fillRect(x, y, iconSize, iconSize);

            // Icon color
            let color = '#fff';
            switch (effect.type) {
                case 'rapidFire': color = '#00ff00'; break;
                case 'damageBoost': color = '#ff0000'; break;
                case 'speedBoost': color = '#0088ff'; break;
                case 'multiShot': color = '#ffff00'; break;
                case 'shield': color = '#00ffff'; break;
            }

            // Fill based on time remaining
            const fillHeight = iconSize * progress;
            ctx.fillStyle = color + '40';
            ctx.fillRect(x, y + (iconSize - fillHeight), iconSize, fillHeight);

            // Border
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, iconSize, iconSize);

            // Initial
            let letter = '?';
            switch (effect.type) {
                case 'rapidFire': letter = 'R'; break;
                case 'damageBoost': letter = 'D'; break;
                case 'speedBoost': letter = 'S'; break;
                case 'multiShot': letter = 'M'; break;
                case 'shield': letter = 'O'; break;
            }

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText(letter, x + iconSize / 2, y + 22);
        });

        ctx.restore();
    }
}
