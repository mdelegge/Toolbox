const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const gameOverEl = document.getElementById('gameOver');
const restartBtn = document.getElementById('restartBtn');

const gridSize = 20;
const tileCount = canvas.width / gridSize;
let snake = [{ x: 10, y: 10 }];
let direction = { x: 0, y: 0 };
let nextDirection = { x: 0, y: 0 };
let food = { x: 5, y: 5 };
let score = 0;
let gameOver = false;
let speed = 8;
let frameCount = 0;

function resetGame() {
    snake = [{ x: 10, y: 10 }];
    direction = { x: 0, y: 0 };
    nextDirection = { x: 0, y: 0 };
    score = 0;
    speed = 8;
    frameCount = 0;
    gameOver = false;
    placeFood();
    scoreEl.textContent = 'Score: 0';
    gameOverEl.classList.add('hidden');
    requestAnimationFrame(gameLoop);
}

function placeFood() {
    let valid = false;
    while (!valid) {
        food.x = Math.floor(Math.random() * tileCount);
        food.y = Math.floor(Math.random() * tileCount);
        valid = !snake.some(seg => seg.x === food.x && seg.y === food.y);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw snake
    ctx.fillStyle = '#4caf50';
    snake.forEach(seg => {
        ctx.fillRect(seg.x * gridSize, seg.y * gridSize, gridSize, gridSize);
    });
    // Draw food
    ctx.fillStyle = '#e91e63';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
}

function update() {
    if (direction.x === 0 && direction.y === 0) return;
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    // Wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver = true;
        return;
    }
    // Self collision
    if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
        gameOver = true;
        return;
    }
    snake.unshift(head);
    // Food collision
    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreEl.textContent = 'Score: ' + score;
        placeFood();
        if (speed < 20 && score % 5 === 0) speed++;
    } else {
        snake.pop();
    }
}

function gameLoop() {
    if (gameOver) {
        gameOverEl.classList.remove('hidden');
        return;
    }
    frameCount++;
    if (frameCount >= Math.floor(60 / speed)) {
        direction = nextDirection;
        update();
        draw();
        frameCount = 0;
    }
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', e => {
    switch (e.key) {
        case 'ArrowUp':
            if (direction.y === 1) break;
            nextDirection = { x: 0, y: -1 };
            break;
        case 'ArrowDown':
            if (direction.y === -1) break;
            nextDirection = { x: 0, y: 1 };
            break;
        case 'ArrowLeft':
            if (direction.x === 1) break;
            nextDirection = { x: -1, y: 0 };
            break;
        case 'ArrowRight':
            if (direction.x === -1) break;
            nextDirection = { x: 1, y: 0 };
            break;
    }
});

restartBtn.addEventListener('click', resetGame);

resetGame();