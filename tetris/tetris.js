// Tetris game implementation
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = [
  null,
  '#00f0f0', // I
  '#f0f000', // O
  '#a000f0', // T
  '#00f000', // S
  '#f00000', // Z
  '#0000f0', // J
  '#f0a000'  // L
];
const TETROMINOES = {
  I: [
    [[0,1],[1,1],[2,1],[3,1]],
    [[2,0],[2,1],[2,2],[2,3]],
    [[0,2],[1,2],[2,2],[3,2]],
    [[1,0],[1,1],[1,2],[1,3]]
  ],
  O: [
    [[1,0],[2,0],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[2,1]]
  ],
  T: [
    [[1,0],[0,1],[1,1],[2,1]],
    [[1,0],[1,1],[2,1],[1,2]],
    [[0,1],[1,1],[2,1],[1,2]],
    [[1,0],[0,1],[1,1],[1,2]]
  ],
  S: [
    [[1,0],[2,0],[0,1],[1,1]],
    [[1,0],[1,1],[2,1],[2,2]],
    [[1,1],[2,1],[0,2],[1,2]],
    [[0,0],[0,1],[1,1],[1,2]]
  ],
  Z: [
    [[0,0],[1,0],[1,1],[2,1]],
    [[2,0],[1,1],[2,1],[1,2]],
    [[0,1],[1,1],[1,2],[2,2]],
    [[1,0],[0,1],[1,1],[0,2]]
  ],
  J: [
    [[0,0],[0,1],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[1,2]],
    [[0,1],[1,1],[2,1],[2,2]],
    [[1,0],[1,1],[0,2],[1,2]]
  ],
  L: [
    [[2,0],[0,1],[1,1],[2,1]],
    [[1,0],[1,1],[1,2],[2,2]],
    [[0,1],[1,1],[2,1],[0,2]],
    [[0,0],[1,0],[1,1],[1,2]]
  ]
};
let board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
let current, next, score = 0, level = 1, lines = 0, dropInterval = 1000, dropTimer, gameOver = false;
const canvas = document.getElementById('tetris-board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');
function randomTetromino() {
  const keys = Object.keys(TETROMINOES);
  const type = keys[Math.floor(Math.random()*keys.length)];
  return {
    type,
    rotation: 0,
    x: 3,
    y: 0,
    shape: TETROMINOES[type]
  };
}
function drawBlock(x, y, color, ctxObj=ctx) {
  ctxObj.fillStyle = color;
  ctxObj.fillRect(x*BLOCK_SIZE, y*BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  ctxObj.strokeStyle = '#222';
  ctxObj.strokeRect(x*BLOCK_SIZE, y*BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}
function drawBoard() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(let y=0; y<ROWS; y++) {
    for(let x=0; x<COLS; x++) {
      if(board[y][x]) drawBlock(x, y, COLORS[board[y][x]]);
    }
  }
}
function drawTetromino(tetro, ctxObj=ctx) {
  const colorIdx = Object.keys(TETROMINOES).indexOf(tetro.type)+1;
  tetro.shape[tetro.rotation].forEach(([x, y]) => {
    drawBlock(tetro.x+x, tetro.y+y, COLORS[colorIdx], ctxObj);
  });
}
function drawNext() {
  nextCtx.clearRect(0,0,nextCanvas.width,nextCanvas.height);
  drawTetromino({...next, x:1, y:1}, nextCtx);
}
function validMove(tetro, dx=0, dy=0, dr=0) {
  const rot = (tetro.rotation+dr+4)%4;
  return tetro.shape[rot].every(([x, y]) => {
    const nx = tetro.x+x+dx;
    const ny = tetro.y+y+dy;
    return nx>=0 && nx<COLS && ny>=0 && ny<ROWS && (!board[ny] || !board[ny][nx]);
  });
}
function mergeTetromino(tetro) {
  const colorIdx = Object.keys(TETROMINOES).indexOf(tetro.type)+1;
  tetro.shape[tetro.rotation].forEach(([x, y]) => {
    const nx = tetro.x+x, ny = tetro.y+y;
    if(ny>=0 && nx>=0 && nx<COLS && ny<ROWS) board[ny][nx] = colorIdx;
  });
}
function clearLines() {
  let cleared = 0;
  for(let y=ROWS-1; y>=0; y--) {
    if(board[y].every(v=>v)) {
      board.splice(y,1);
      board.unshift(Array(COLS).fill(0));
      cleared++;
      y++;
    }
  }
  if(cleared) {
    score += [0,40,100,300,1200][cleared]*level;
    lines += cleared;
    if(lines>=level*10) {
      level++;
      dropInterval = Math.max(100, dropInterval-100);
    }
    document.getElementById('score').textContent = 'Score: '+score;
    document.getElementById('level').textContent = 'Level: '+level;
  }
}
function drop() {
  if(gameOver) return;
  if(validMove(current,0,1)) {
    current.y++;
  } else {
    mergeTetromino(current);
    clearLines();
    current = next;
    next = randomTetromino();
    drawNext();
    if(!validMove(current)) {
      endGame();
      return;
    }
  }
  drawBoard();
  drawTetromino(current);
}
function hardDrop() {
  while(validMove(current,0,1)) current.y++;
  drop();
}
function endGame() {
  gameOver = true;
  document.getElementById('game-over').classList.remove('hidden');
  document.getElementById('restart-btn').classList.remove('hidden');
  clearInterval(dropTimer);
}
function restart() {
  board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
  score = 0; level = 1; lines = 0; dropInterval = 1000; gameOver = false;
  current = randomTetromino();
  next = randomTetromino();
  document.getElementById('score').textContent = 'Score: 0';
  document.getElementById('level').textContent = 'Level: 1';
  document.getElementById('game-over').classList.add('hidden');
  document.getElementById('restart-btn').classList.add('hidden');
  drawBoard();
  drawTetromino(current);
  drawNext();
  dropTimer = setInterval(drop, dropInterval);
}
document.addEventListener('keydown', e => {
  if(gameOver) return;
  if(e.key==='ArrowLeft' && validMove(current,-1,0)) current.x--;
  else if(e.key==='ArrowRight' && validMove(current,1,0)) current.x++;
  else if(e.key==='ArrowDown' && validMove(current,0,1)) current.y++;
  else if(e.key===' ') hardDrop();
  else if(e.key==='ArrowUp' && validMove(current,0,0,1)) current.rotation = (current.rotation+1)%4;
  drawBoard();
  drawTetromino(current);
});
document.getElementById('restart-btn').onclick = restart;
// Start game
current = randomTetromino();
next = randomTetromino();
drawBoard();
drawTetromino(current);
drawNext();
dropTimer = setInterval(drop, dropInterval);