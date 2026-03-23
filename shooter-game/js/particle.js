class Particle {
    constructor(x, y, vx, vy, color, size, lifetime) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.maxLifetime = lifetime;
        this.lifetime = lifetime;
        this.isActive = true;
        this.rotation = 0;
        this.rotVel = 0;
        this.isCasing = false;
    }

    update(deltaTime) {
        // Move
        const dt = deltaTime / 1000;
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Apply drag
        this.vx *= 0.98;
        this.vy *= 0.98;
        
        if (this.isCasing) {
            this.rotation += this.rotVel * dt;
            // Gravity effect for casings
            this.vy += 200 * dt;
        }

        // Update lifetime
        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) {
            this.isActive = false;
        }
    }

    render(ctx) {
        const alpha = this.lifetime / this.maxLifetime;
        ctx.save();
        ctx.globalAlpha = alpha;
        
        if (this.isCasing) {
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.fillStyle = this.color;
            ctx.fillRect(-2, -1, 4, 2);
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    add(x, y, vx, vy, color, size, lifetime) {
        this.particles.push(new Particle(x, y, vx, vy, color, size, lifetime));
    }

    // Muzzle flash at gun position
    createMuzzleFlash(x, y, angle) {
        const color = '#ffff00';
        const count = 5 + Math.random() * 5;

        for (let i = 0; i < count; i++) {
            const spread = (Math.random() - 0.5) * 0.5;
            const speed = 100 + Math.random() * 150;
            const vx = Math.cos(angle + spread) * speed;
            const vy = Math.sin(angle + spread) * speed;
            const size = 3 + Math.random() * 4;
            const lifetime = 50 + Math.random() * 50;

            this.add(x, y, vx, vy, color, size, lifetime);
        }
    }

    // Bullet casing ejected from gun
    createCasing(x, y, angle) {
        const casingAngle = angle + Math.PI / 2 + (Math.random() - 0.5) * 0.5;
        const speed = 50 + Math.random() * 50;
        const vx = Math.cos(casingAngle) * speed;
        const vy = Math.sin(casingAngle) * speed - 50;
        
        const p = new Particle(x, y, vx, vy, '#ffcc00', 4, 1000);
        p.isCasing = true;
        p.rotVel = (Math.random() - 0.5) * 20;
        this.particles.push(p);
    }

    // Footstep dust when moving
    createFootstep(x, y) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 10 + Math.random() * 20;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        this.add(x, y, vx, vy, '#555555', 2 + Math.random() * 3, 300 + Math.random() * 200);
    }

    // Blood splatter when enemy hit
    createBloodSplatter(x, y, count = 8) {
        const colors = ['#ff0000', '#cc0000', '#aa0000'];

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = 3 + Math.random() * 5;
            const lifetime = 300 + Math.random() * 400;

            this.add(x, y, vx, vy, color, size, lifetime);
        }
    }

    // Explosion when enemy dies
    createExplosion(x, y, size = 'medium') {
        const colors = ['#ff6600', '#ffaa00', '#ff0000', '#ffff00'];
        const count = size === 'small' ? 15 : size === 'large' ? 40 : 25;

        // Core particles
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 150;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const particleSize = 4 + Math.random() * 8;
            const lifetime = 400 + Math.random() * 500;

            this.add(x, y, vx, vy, color, particleSize, lifetime);
        }

        // Smoke particles
        for (let i = 0; i < count / 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 20 + Math.random() * 60;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 30; // Rise up
            const color = '#666666';
            const particleSize = 6 + Math.random() * 10;
            const lifetime = 600 + Math.random() * 400;

            this.add(x, y, vx, vy, color, particleSize, lifetime);
        }
    }

    // Hit spark when bullet hits enemy
    createHitSpark(x, y) {
        const colors = ['#ffff00', '#ffffff', '#ffaa00'];

        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 120;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = 2 + Math.random() * 3;
            const lifetime = 100 + Math.random() * 150;

            this.add(x, y, vx, vy, color, size, lifetime);
        }
    }

    update(deltaTime) {
        this.particles.forEach(p => p.update(deltaTime));
        this.particles = this.particles.filter(p => p.isActive);
    }

    render(ctx) {
        this.particles.forEach(p => p.render(ctx));
    }
}
