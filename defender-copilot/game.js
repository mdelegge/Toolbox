// Defender Game - core logic
// Classes: Game, Player, Enemy, Projectile, Terrain

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = 'start';
        this.score = 0;
        this.lives = 3;
        this.player = new Player(this.canvas.width / 2, this.canvas.height - 60);
        this.enemies = [];
        this.projectiles = [];
        this.terrain = new Terrain();
        this.lastEnemySpawn = 0;
        this.enemySpawnInterval = 1500;
        this.keys = {};
        this.initEvents();
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }
    initEvents() {
        window.addEventListener('keydown', e => this.keys[e.code] = true);
        window.addEventListener('keyup', e => this.keys[e.code] = false);
        this.canvas.addEventListener('click', () => {
            if (this.state === 'start' || this.state === 'gameover') {
                this.reset();
                this.state = 'playing';
            }
        });
    }
    reset() {
        this.score = 0;
        this.lives = 3;
        this.player = new Player(this.canvas.width / 2, this.canvas.height - 60);
        this.enemies = [];
        this.projectiles = [];
        this.terrain = new Terrain();
    }
    loop(ts) {
        this.update(ts);
        this.render();
        requestAnimationFrame(this.loop);
    }
    update(ts) {
        if (this.state !== 'playing') return;
        this.terrain.update();
        this.player.update(this.keys, this.projectiles);
        this.projectiles.forEach(p => p.update());
        this.projectiles = this.projectiles.filter(p => !p.outOfBounds());
        // Enemy spawn
        if (!this.lastEnemySpawn || ts - this.lastEnemySpawn > this.enemySpawnInterval) {
            this.spawnEnemy();
            this.lastEnemySpawn = ts;
        }
        this.enemies.forEach(e => e.update());
        this.enemies = this.enemies.filter(e => !e.outOfBounds());
        // Collisions
        this.checkCollisions();
        // Game over
        if (this.lives <= 0) {
            this.state = 'gameover';
        }
    }
    spawnEnemy() {
        const type = Math.random() < 0.5 ? 'ground' : 'flying';
        if (type === 'ground') {
            this.enemies.push(new GroundEnemy(-40, 540));
        } else {
            this.enemies.push(new FlyingEnemy(-40, Math.random() * 400 + 50));
        }
    }
    checkCollisions() {
        // Player projectiles vs enemies
        this.projectiles.forEach((p, pi) => {
            this.enemies.forEach((e, ei) => {
                if (p.collidesWith(e)) {
                    this.score += e.points;
                    this.enemies.splice(ei, 1);
                    this.projectiles.splice(pi, 1);
                }
            });
        });
        // Enemies vs player
        this.enemies.forEach((e, ei) => {
            if (e.collidesWith(this.player)) {
                this.lives--;
                this.enemies.splice(ei, 1);
            }
        });
    }
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.terrain.render(this.ctx);
        this.player.render(this.ctx);
        this.enemies.forEach(e => e.render(this.ctx));
        this.projectiles.forEach(p => p.render(this.ctx));
        document.getElementById('score').textContent = 'Score: ' + this.score;
        document.getElementById('lives').textContent = 'Lives: ' + this.lives;
        const stateDiv = document.getElementById('gameState');
        if (this.state === 'start') {
            stateDiv.textContent = 'Click to Start';
        } else if (this.state === 'gameover') {
            stateDiv.textContent = 'Game Over! Click to Restart.';
        } else {
            stateDiv.textContent = '';
        }
    }
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 20;
        this.speed = 5;
        this.cooldown = 0;
    }
    update(keys, projectiles) {
        if (keys['ArrowLeft']) this.x -= this.speed;
        if (keys['ArrowRight']) this.x += this.speed;
        if (keys['ArrowUp']) this.y -= this.speed;
        if (keys['ArrowDown']) this.y += this.speed;
        // Boundaries
        this.x = Math.max(0, Math.min(760, this.x));
        this.y = Math.max(0, Math.min(580, this.y));
        // Fire
        if (keys['Space'] && this.cooldown <= 0) {
            projectiles.push(new Projectile(this.x + this.width, this.y + this.height / 2, 10, 0));
            this.cooldown = 15;
        }
        if (this.cooldown > 0) this.cooldown--;
    }
    render(ctx) {
        ctx.save();
        ctx.fillStyle = '#0ff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
    collidesWith(e) {
        return this.x < e.x + e.width && this.x + this.width > e.x &&
               this.y < e.y + e.height && this.y + this.height > e.y;
    }
}

class Projectile {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.width = 8;
        this.height = 4;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
    }
    outOfBounds() {
        return this.x > 800 || this.x < 0 || this.y > 600 || this.y < 0;
    }
    render(ctx) {
        ctx.save();
        ctx.fillStyle = '#ff0';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
    collidesWith(e) {
        return this.x < e.x + e.width && this.x + this.width > e.x &&
               this.y < e.y + e.height && this.y + this.height > e.y;
    }
}

class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 20;
        this.points = 100;
    }
    update() {}
    render(ctx) {
        ctx.save();
        ctx.fillStyle = '#f00';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
    outOfBounds() {
        return this.x > 800 || this.x < -40;
    }
    collidesWith(e) {
        return this.x < e.x + e.width && this.x + this.width > e.x &&
               this.y < e.y + e.height && this.y + this.height > e.y;
    }
}

class GroundEnemy extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.points = 150;
    }
    update() {
        this.x += 2;
    }
    render(ctx) {
        ctx.save();
        ctx.fillStyle = '#0f0';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}

class FlyingEnemy extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.points = 200;
        this.dir = Math.random() < 0.5 ? 1 : -1;
    }
    update() {
        this.x += 3;
        this.y += Math.sin(Date.now() / 200) * this.dir;
    }
    render(ctx) {
        ctx.save();
        ctx.fillStyle = '#f0f';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}

class Terrain {
    constructor() {
        this.offset = 0;
    }
    update() {
        this.offset += 2;
        if (this.offset > 800) this.offset = 0;
    }
    render(ctx) {
        ctx.save();
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.moveTo(0, 580);
        for (let x = 0; x <= 800; x += 40) {
            let y = 580 - Math.abs(Math.sin((x + this.offset) / 80) * 20);
            ctx.lineTo(x, y);
        }
        ctx.lineTo(800, 600);
        ctx.lineTo(0, 600);
        ctx.closePath();
        ctx.fill();
        // Draw city/humanoid
        ctx.fillStyle = '#fff';
        ctx.fillRect(100 - this.offset % 800, 560, 20, 20);
        ctx.restore();
    }
}

window.onload = () => {
    new Game();
};