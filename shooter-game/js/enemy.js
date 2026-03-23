class Enemy {
    constructor(x, y, type = 'basic') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 16;
        this.isActive = true;
        this.isElite = false;
        this.isBoss = false;

        // Stats based on type
        switch (type) {
            case 'basic':
                this.speed = 80;
                this.maxHealth = 30;
                this.health = 30;
                this.color = '#ff4444';
                this.scoreValue = 10;
                break;
            case 'fast':
                this.speed = 150;
                this.maxHealth = 15;
                this.health = 15;
                this.color = '#ff00ff';
                this.scoreValue = 20;
                break;
            case 'tank':
                this.speed = 40;
                this.maxHealth = 80;
                this.health = 80;
                this.color = '#ff8800';
                this.scoreValue = 50;
                this.radius = 24;
                break;
            default:
                this.speed = 80;
                this.maxHealth = 30;
                this.health = 30;
                this.color = '#ff4444';
                this.scoreValue = 10;
        }

        this.flashTime = 0; // White flash when hit
        this.auraAngle = 0; // For elite/boss aura

        // FSM State
        this.state = 'chase';
        this.stateTimer = 0;
    }

    update(deltaTime, player) {
        if (!this.isActive) return;

        const dist = Utils.distance(this.x, this.y, player.x, player.y);
        const angle = Utils.angleBetween(this.x, this.y, player.x, player.y);
        const dt = deltaTime / 1000;

        // State Transitions
        if (this.state === 'retreat') {
            this.stateTimer -= deltaTime;
            if (this.stateTimer <= 0) {
                this.state = 'chase';
            }
        } else {
            // Check for retreat trigger
            if (this.health < this.maxHealth * 0.3) {
                this.state = 'retreat';
                this.stateTimer = 1000 + Math.random() * 1000; // 1-2 seconds
            } else {
                // Check for attack trigger
                if (dist < 40) {
                    this.state = 'attack';
                } else {
                    this.state = 'chase';
                }
            }
        }

        // State Behaviors
        switch (this.state) {
            case 'chase':
                this.handleChase(dt, angle);
                break;
            case 'attack':
                this.handleAttack();
                break;
            case 'retreat':
                this.handleRetreat(dt, angle);
                break;
        }

        // Hit flash decay
        if (this.flashTime > 0) {
            this.flashTime -= deltaTime;
        }

        // Elite/Boss aura animation
        if (this.isElite || this.isBoss) {
            this.auraAngle += deltaTime * 0.005;
        }
    }

    handleChase(dt, angle) {
        this.x += Math.cos(angle) * this.speed * dt;
        this.y += Math.sin(angle) * this.speed * dt;
    }

    handleAttack() {
        // Stop moving to "attack"
        // Actual damage is handled by Game.checkCollisions()
    }

    handleRetreat(dt, angle) {
        // Move away from player
        this.x -= Math.cos(angle) * this.speed * dt;
        this.y -= Math.sin(angle) * this.speed * dt;
    }

    takeDamage(amount) {
        this.health -= amount;
        this.flashTime = 100; // ms

        if (this.health <= 0) {
            this.health = 0;
            this.isActive = false;
            return true; // Died
        }
        return false; // Still alive
    }

    render(ctx) {
        if (!this.isActive) return;

        // Elite/Boss Aura
        if (this.isElite || this.isBoss) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.auraAngle);
            
            const auraSize = this.radius * (this.isBoss ? 1.5 : 1.3);
            ctx.strokeStyle = this.isBoss ? '#ff0000' : '#ffff00';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(0, 0, auraSize, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + this.radius * 0.6, this.radius * 0.8, this.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body - flash white when hit
        if (this.flashTime > 0) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = this.isBoss ? '#660000' : this.color;
        }

        // Draw enemy shape
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = this.isElite ? '#ffff00' : this.isBoss ? '#ffffff' : '#000';
        ctx.lineWidth = this.isElite || this.isBoss ? 3 : 2;
        ctx.stroke();

        // Inner detail based on type
        ctx.fillStyle = '#000';
        if (this.type === 'basic') {
            // X eyes
            ctx.fillRect(this.x - 6, this.y - 6, 4, 4);
            ctx.fillRect(this.x + 2, this.y - 6, 4, 4);
            ctx.fillRect(this.x - 4, this.y + 2, 8, 2);
        } else if (this.type === 'fast') {
            // Angry eyes
            ctx.beginPath();
            ctx.moveTo(this.x - 8, this.y - 4);
            ctx.lineTo(this.x - 2, this.y);
            ctx.lineTo(this.x - 8, this.y + 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(this.x + 8, this.y - 4);
            ctx.lineTo(this.x + 2, this.y);
            ctx.lineTo(this.x + 8, this.y + 2);
            ctx.stroke();
        } else if (this.type === 'tank' || this.isBoss) {
            // Heavy brow
            ctx.fillRect(this.x - 10, this.y - 8, 20, 4);
            ctx.fillRect(this.x - 4, this.y, 8, 8);
        }

        // Health bar for tank, elite, or boss
        if (this.type === 'tank' || this.isElite || this.isBoss) {
            const barWidth = this.radius * 2.5;
            const barHeight = this.isBoss ? 8 : 4;
            const healthPercent = this.health / this.maxHealth;

            ctx.fillStyle = '#330000';
            ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - (this.isBoss ? 20 : 10), barWidth, barHeight);

            ctx.fillStyle = this.isElite ? '#ffff00' : '#ff0000';
            ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - (this.isBoss ? 20 : 10), barWidth * healthPercent, barHeight);
            
            if (this.isBoss) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.strokeRect(this.x - barWidth / 2, this.y - this.radius - 20, barWidth, barHeight);
            }
        }
    }

    // For collision detection
    getBounds() {
        return {
            x: this.x - this.radius,
            y: this.y - this.radius,
            width: this.radius * 2,
            height: this.radius * 2
        };
    }
}
