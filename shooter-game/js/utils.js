const Utils = {
    randomRange: function(min, max) {
        return Math.random() * (max - min) + min;
    },

    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    distance: function(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },

    angleBetween: function(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },

    clamp: function(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    lerp: function(start, end, t) {
        return start + (end - start) * t;
    }
};
