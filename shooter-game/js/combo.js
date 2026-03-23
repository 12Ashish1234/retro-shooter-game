class ComboSystem {
    constructor() {
        this.combo = 0;
        this.timer = 0;
        this.maxTime = 3000; // 3 seconds to chain
        this.multiplier = 1;
        
        this.visualScale = 1;
        this.popTime = 0;
    }

    addKill() {
        this.combo++;
        this.timer = this.maxTime;
        
        // Update multiplier
        if (this.combo >= 20) this.multiplier = 4;
        else if (this.combo >= 10) this.multiplier = 3;
        else if (this.combo >= 5) this.multiplier = 2;
        else this.multiplier = 1;
        
        // Pop effect
        this.popTime = 200;
        this.visualScale = 1.5;
    }

    update(deltaTime) {
        if (this.combo > 0) {
            this.timer -= deltaTime;
            if (this.timer <= 0) {
                this.reset();
            }
        }
        
        // Decay visual pop
        if (this.popTime > 0) {
            this.popTime -= deltaTime;
            this.visualScale = 1 + (this.popTime / 200) * 0.5;
        } else {
            this.visualScale = 1;
        }
    }

    reset() {
        this.combo = 0;
        this.timer = 0;
        this.multiplier = 1;
    }

    getScoreMultiplier() {
        return this.multiplier;
    }

    render(ctx) {
        if (this.combo < 2) return;
        
        const x = 700;
        const y = 130;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(this.visualScale, this.visualScale);
        
        // Combo text
        ctx.fillStyle = this.multiplier > 2 ? '#ff00ff' : this.multiplier > 1 ? '#ffff00' : '#00ffff';
        ctx.font = 'bold 20px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.combo}x`, 0, 0);
        
        ctx.font = '10px "Press Start 2P"';
        ctx.fillText('COMBO', 0, 20);
        
        // Timer bar
        const barWidth = 60;
        const barHeight = 4;
        const progress = this.timer / this.maxTime;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(-barWidth / 2, 30, barWidth, barHeight);
        
        ctx.fillStyle = '#fff';
        ctx.fillRect(-barWidth / 2, 30, barWidth * progress, barHeight);
        
        ctx.restore();
    }
}
