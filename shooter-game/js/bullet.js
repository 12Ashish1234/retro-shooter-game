class Bullet {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.radius = 3;
        this.speed = 0;
        this.damage = 0;
        this.velocity = { x: 0, y: 0 };
        this.isActive = false;
        this.lifetime = 2000;
        this.age = 0;
        this.trail = [];
    }

    init(x, y, angle, speed = 600, damage = 12) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.damage = damage;
        this.velocity.x = Math.cos(angle) * this.speed;
        this.velocity.y = Math.sin(angle) * this.speed;
        this.isActive = true;
        this.age = 0;
        this.trail = [];
    }

    update(deltaTime) {
        if (!this.isActive) return;

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
        if (!this.isActive) return;

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

class BulletPool {
    constructor(initialSize = 50) {
        this.pool = [];
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(new Bullet());
        }
    }

    get() {
        // Find an inactive bullet
        let bullet = this.pool.find(b => !b.isActive);
        
        // If none found, expand the pool
        if (!bullet) {
            bullet = new Bullet();
            this.pool.push(bullet);
        }
        
        return bullet;
    }

    // Optional: Return to pool helper if we wanted more complex management, 
    // but isActive flag is sufficient for simple pooling
}
