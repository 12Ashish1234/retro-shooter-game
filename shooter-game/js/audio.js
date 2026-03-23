const Audio = {
    ctx: null,
    enabled: true,
    masterVolume: 0.3,

    init: function() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio not supported');
            this.enabled = false;
        }
    },

    // Generate a synthesized gunshot sound
    playShoot: function() {
        if (!this.enabled || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        // Noise buffer for "kick"
        const bufferSize = this.ctx.sampleRate * 0.1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.01));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.value = 0.3;

        // Oscillator for tone
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);

        // Filter
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);

        // Gain envelope
        gain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

        // Connect
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        // Play
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.15);
        noise.start(this.ctx.currentTime);
    },

    // Explosion sound
    playExplosion: function(size = 'medium') {
        if (!this.enabled || !this.ctx) return;

        const duration = size === 'large' ? 0.4 : size === 'small' ? 0.2 : 0.3;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        // Generate explosion noise
        for (let i = 0; i < bufferSize; i++) {
            const t = i / this.ctx.sampleRate;
            const envelope = Math.exp(-t / (duration * 0.3));
            data[i] = (Math.random() * 2 - 1) * envelope;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        // Lowpass filter for deeper explosion
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = size === 'large' ? 300 : size === 'small' ? 800 : 500;

        const gain = this.ctx.createGain();
        gain.gain.value = this.masterVolume * 0.5;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(this.ctx.currentTime);
    },

    // Hit sound
    playHit: function() {
        if (!this.enabled || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(this.masterVolume * 0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.1);
    },

    // Damage sound (player hurt)
    playDamage: function() {
        if (!this.enabled || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(this.masterVolume * 0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.3);
    },

    // Level up sound
    playLevelUp: function() {
        if (!this.enabled || !this.ctx) return;

        const notes = [440, 554, 659, 880]; // A major chord
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            const startTime = this.ctx.currentTime + i * 0.1;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(this.masterVolume * 0.3, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + 0.5);
        });
    },

    // Background drone (very subtle)
    playBackground: function() {
        if (!this.enabled || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = 50;

        gain.gain.value = this.masterVolume * 0.05;

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        this.bgOsc = osc;
        this.bgGain = gain;
    },

    stopBackground: function() {
        if (this.bgOsc) {
            this.bgOsc.stop();
            this.bgOsc = null;
        }
    }
};
