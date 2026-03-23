class Weapon {
    constructor(type, ammo = Infinity) {
        this.type = type;
        this.ammo = ammo;
        
        // Weapon stats
        switch (type) {
            case 'pistol':
                this.name = 'Pistol';
                this.shootDelay = 150;
                this.damage = 12;
                this.bulletSpeed = 500;
                this.spread = 0.05;
                this.recoil = 5;
                break;
            case 'shotgun':
                this.name = 'Shotgun';
                this.shootDelay = 600;
                this.damage = 10; // per pellet
                this.bulletSpeed = 450;
                this.spread = 0.3;
                this.pellets = 6;
                this.recoil = 15;
                break;
            case 'laser':
                this.name = 'Laser';
                this.shootDelay = 50;
                this.damage = 5;
                this.bulletSpeed = 1000;
                this.spread = 0.01;
                this.recoil = 2;
                break;
        }
    }
}

class WeaponSystem {
    constructor(player) {
        this.player = player;
        this.weapons = {
            pistol: new Weapon('pistol'),
            shotgun: new Weapon('shotgun', 0),
            laser: new Weapon('laser', 0)
        };
        this.currentWeapon = 'pistol';
    }

    switchWeapon(type) {
        if (this.weapons[type] && (this.weapons[type].ammo > 0 || this.weapons[type].ammo === Infinity)) {
            this.currentWeapon = type;
            const w = this.weapons[type];
            this.player.shootDelay = w.shootDelay;
            this.player.maxRecoil = w.recoil;
            return true;
        }
        return false;
    }

    addAmmo(type, amount) {
        if (this.weapons[type]) {
            this.weapons[type].ammo += amount;
            return true;
        }
        return false;
    }

    getCurrent() {
        return this.weapons[this.currentWeapon];
    }

    update(deltaTime) {
        // Handle auto-switch if ammo runs out
        if (this.currentWeapon !== 'pistol' && this.weapons[this.currentWeapon].ammo <= 0) {
            this.switchWeapon('pistol');
        }
    }

    renderUI(ctx) {
        const weapon = this.getCurrent();
        ctx.fillStyle = '#fff';
        ctx.font = '14px "Press Start 2P"';
        ctx.fillText(`WEAPON: ${weapon.name}`, 20, 560);
        
        const ammoStr = weapon.ammo === Infinity ? '∞' : weapon.ammo;
        ctx.fillText(`AMMO: ${ammoStr}`, 20, 585);
        
        // Show selection hints
        ctx.fillStyle = '#666';
        ctx.font = '10px "Press Start 2P"';
        ctx.fillText('1: Pistol  2: Shotgun  3: Laser', 200, 585);
    }
}
