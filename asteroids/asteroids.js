// Asteroids Game Implementation
// Classes: Ship, Asteroid, Laser
// Handles: input, rendering, collisions, scoring, lives, game over

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

// Game State
let score = 0;
let lives = 3;
let gameOver = false;
let asteroids = [];
let lasers = [];
let ship;

// Utility
function randomBetween(a, b) {
  return Math.random() * (b - a) + a;
}
function dist(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

// Ship Class
class Ship {
  constructor() {
    this.x = W / 2;
    this.y = H / 2;
    this.r = 18;
    this.angle = 0;
    this.vel = {x: 0, y: 0};
    this.thrusting = false;
    this.rotation = 0;
    this.canShoot = true;
  }
  rotate(dir) {
    this.rotation = dir;
  }
  thrust(on) {
    this.thrusting = on;
  }
  update() {
    // Rotation
    this.angle += this.rotation * 0.07;
    // Thrust
    if (this.thrusting) {
      this.vel.x += Math.cos(this.angle) * 0.15;
      this.vel.y += Math.sin(this.angle) * 0.15;
    }
    // Friction
    this.vel.x *= 0.99;
    this.vel.y *= 0.99;
    // Move
    this.x += this.vel.x;
    this.y += this.vel.y;
    // Screen wrap
    if (this.x < 0) this.x += W;
    if (this.x > W) this.x -= W;
    if (this.y < 0) this.y += H;
    if (this.y > H) this.y -= H;
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.beginPath();
    ctx.moveTo(this.r, 0);
    ctx.lineTo(-this.r * 0.7, this.r * 0.6);
    ctx.lineTo(-this.r * 0.7, -this.r * 0.6);
    ctx.closePath();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
  shoot() {
    if (this.canShoot && !gameOver) {
      lasers.push(new Laser(this.x, this.y, this.angle));
      this.canShoot = false;
      setTimeout(() => this.canShoot = true, 200);
    }
  }
}

// Asteroid Class
class Asteroid {
  constructor(x, y, r, level = 1) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.level = level; // 1: large, 2: medium, 3: small
    this.angle = randomBetween(0, Math.PI * 2);
    this.speed = randomBetween(0.7, 2.2) / level;
    this.vel = {
      x: Math.cos(this.angle) * this.speed,
      y: Math.sin(this.angle) * this.speed
    };
    this.vertices = Math.floor(randomBetween(8, 12));
    this.offsets = Array.from({length: this.vertices}, () => randomBetween(0.7, 1.2));
  }
  update() {
    this.x += this.vel.x;
    this.y += this.vel.y;
    // Screen wrap
    if (this.x < 0) this.x += W;
    if (this.x > W) this.x -= W;
    if (this.y < 0) this.y += H;
    if (this.y > H) this.y -= H;
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.beginPath();
    for (let i = 0; i < this.vertices; i++) {
      let angle = (Math.PI * 2 / this.vertices) * i;
      let r = this.r * this.offsets[i];
      ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.strokeStyle = '#a3e635';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}

// Laser Class
class Laser {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = 8;
    this.dist = 0;
    this.maxDist = 500;
  }
  update() {
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
    this.dist += this.speed;
    // Screen wrap
    if (this.x < 0) this.x += W;
    if (this.x > W) this.x -= W;
    if (this.y < 0) this.y += H;
    if (this.y > H) this.y -= H;
  }
  draw() {
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();
    ctx.restore();
  }
}

function spawnAsteroids(num) {
  asteroids = [];
  for (let i = 0; i < num; i++) {
    let r = randomBetween(38, 60);
    let x, y;
    // Avoid spawning on top of ship
    do {
      x = randomBetween(0, W);
      y = randomBetween(0, H);
    } while (dist(x, y, W/2, H/2) < 120);
    asteroids.push(new Asteroid(x, y, r, 1));
  }
}

function resetGame() {
  score = 0;
  lives = 3;
  gameOver = false;
  ship = new Ship();
  lasers = [];
  spawnAsteroids(4);
  document.getElementById('score').textContent = 'Score: 0';
  document.getElementById('lives').textContent = 'Lives: 3';
  document.getElementById('gameOver').style.display = 'none';
  document.getElementById('restartBtn').style.display = 'none';
}

function update() {
  if (gameOver) return;
  ship.update();
  asteroids.forEach(a => a.update());
  lasers.forEach(l => l.update());
  // Remove lasers that have traveled max distance
  lasers = lasers.filter(l => l.dist < l.maxDist);
  // Collisions: lasers vs asteroids
  for (let l = lasers.length - 1; l >= 0; l--) {
    for (let a = asteroids.length - 1; a >= 0; a--) {
      if (dist(lasers[l].x, lasers[l].y, asteroids[a].x, asteroids[a].y) < asteroids[a].r) {
        // Hit!
        let level = asteroids[a].level;
        let r = asteroids[a].r;
        let x = asteroids[a].x;
        let y = asteroids[a].y;
        // Remove asteroid and laser
        asteroids.splice(a, 1);
        lasers.splice(l, 1);
        // Score
        score += (4 - level) * 100;
        document.getElementById('score').textContent = 'Score: ' + score;
        // Split asteroid
        if (level < 3) {
          for (let i = 0; i < 2; i++) {
            asteroids.push(new Asteroid(x, y, r / 1.7, level + 1));
          }
        }
        break;
      }
    }
  }
  // Collisions: ship vs asteroids
  for (let a = asteroids.length - 1; a >= 0; a--) {
    if (dist(ship.x, ship.y, asteroids[a].x, asteroids[a].y) < ship.r + asteroids[a].r * 0.8) {
      // Lose a life
      lives--;
      document.getElementById('lives').textContent = 'Lives: ' + lives;
      if (lives <= 0) {
        gameOver = true;
        document.getElementById('gameOver').style.display = 'block';
        document.getElementById('finalScore').textContent = score;
        document.getElementById('restartBtn').style.display = 'inline-block';
      }
      // Reset ship position
      ship = new Ship();
      break;
    }
  }
  // Next wave
  if (asteroids.length === 0 && !gameOver) {
    spawnAsteroids(4 + Math.floor(score / 500));
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  ship.draw();
  asteroids.forEach(a => a.draw());
  lasers.forEach(l => l.draw());
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Input Handling
const keys = {};
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') ship.rotate(-1);
  if (e.code === 'ArrowRight' || e.code === 'KeyD') ship.rotate(1);
  if (e.code === 'ArrowUp' || e.code === 'KeyW') ship.thrust(true);
  if (e.code === 'Space' || e.code === 'KeyJ') ship.shoot();
});
document.addEventListener('keyup', e => {
  keys[e.code] = false;
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') ship.rotate(0);
  if (e.code === 'ArrowRight' || e.code === 'KeyD') ship.rotate(0);
  if (e.code === 'ArrowUp' || e.code === 'KeyW') ship.thrust(false);
});

document.getElementById('restartBtn').addEventListener('click', () => {
  resetGame();
});

// Start Game
resetGame();
gameLoop();