class Bullet {
    constructor(x, y, angle, speed = 600, damage = 12) {
        this.x = x;
        this.y = y;
        this.radius = 3;
        this.speed = speed; // pixels per second
        this.damage = damage;
        this.velocity = {
            x: Math.cos(angle) * this.speed,
            y: Math.sin(angle) * this.speed
        };
        this.isActive = true;
        this.lifetime = 2000; // ms
        this.age = 0;
        this.trail = []; // For visual effect
    }

    update(deltaTime) {
        // Store trail positions
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 5) {
            this.trail.shift();
        }

        // Move
        const dt = deltaTime / 1000;
        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;

        // Update lifetime
        this.age += deltaTime;
        if (this.age >= this.lifetime) {
            this.isActive = false;
        }

        // Check bounds
        if (this.x < 0 || this.x > 800 || this.y < 0 || this.y > 600) {
            this.isActive = false;
        }
    }

    render(ctx) {
        // Draw trail
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        this.trail.forEach((pos, index) => {
            const size = (index / this.trail.length) * this.radius;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw bullet
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();
    }
}
