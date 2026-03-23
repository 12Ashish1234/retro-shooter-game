const Input = {
    keys: {},
    mouse: { x: 0, y: 0, down: false },

    init: function(canvas) {
        // Keyboard events
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            // Prevent default for game keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Mouse events
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        canvas.addEventListener('mousedown', () => {
            this.mouse.down = true;
        });

        canvas.addEventListener('mouseup', () => {
            this.mouse.down = false;
        });
    },

    isKeyDown: function(keyCode) {
        return !!this.keys[keyCode];
    },

    getMousePos: function() {
        return { x: this.mouse.x, y: this.mouse.y };
    },

    isMouseDown: function() {
        return this.mouse.down;
    }
};
