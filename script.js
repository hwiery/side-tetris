const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const cellSize = 30;
const rows = 20;
const cols = 20;
canvas.width = cols * cellSize;
canvas.height = rows * cellSize;

let board = Array.from({ length: rows }, () => Array(cols).fill(0));
const shapes = [
  [[1,1,1,1]],
  [[1,1],[1,1]],
  [[0,1,0],[1,1,1]],
  [[0,1,1],[1,1,0]],
  [[1,1,0],[0,1,1]],
  [[1,0,0],[1,1,1]],
  [[0,0,1],[1,1,1]]
];
const dropDirections = ['down','left','right'];

let current = null;
let dropSpeed = 500;
let lastDrop = Date.now();
let score = 0;
let playing = false;

// 시작 버튼 참조
const startBtn = document.getElementById('start');
startBtn.style.display = 'block';
startBtn.addEventListener('click', () => {
  resetGame();
  startBtn.style.display = 'none';
  playing = true;
});

// 게임 초기화 함수
function resetGame() {
  board = Array.from({ length: rows }, () => Array(cols).fill(0));
  score = 0;
  document.getElementById('score').innerText = '점수: ' + score;
  spawnShape();
  lastDrop = Date.now();
}

// 게임 종료 처리
function endGame() {
  playing = false;
  startBtn.style.display = 'block';
}

// 최상단(row 0)에 블록이 있는지 확인하여 게임오버 처리
function checkGameOverOnTop() {
  if (board[0].some(cell => cell !== 0)) {
    endGame();
  }
}

// 하드 드롭 구현
function hardDrop() {
  const { dx, dy, shape } = current;
  while (!collide(current.x + dx, current.y + dy, shape)) {
    current.x += dx;
    current.y += dy;
  }
  lock();
  clearLines();
  checkGameOverOnTop();
  spawnShape();
}

function rotate(shape) {
  const h = shape.length, w = shape[0].length;
  let res = [];
  for (let x = 0; x < w; x++) {
    res[x] = [];
    for (let y = h - 1; y >= 0; y--) {
      res[x][h - 1 - y] = shape[y][x];
    }
  }
  return res;
}

function spawnShape() {
  const idx = Math.floor(Math.random() * shapes.length);
  const shape = shapes[idx];
  const dir = dropDirections[Math.floor(Math.random() * dropDirections.length)];
  let x, y, dx, dy;
  if (dir === 'down') {
    x = Math.floor((cols - shape[0].length) / 2);
    y = 0;
    dx = 0; dy = 1;
  } else if (dir === 'left') {
    x = 0;
    y = Math.floor((rows - shape.length) / 2);
    dx = 1; dy = 0;
  } else {
    x = cols - shape[0].length;
    y = Math.floor((rows - shape.length) / 2);
    dx = -1; dy = 0;
  }
  current = { shape, x, y, dx, dy, dir };
}

function collide(x, y, shape) {
  for (let i = 0; i < shape.length; i++) {
    for (let j = 0; j < shape[i].length; j++) {
      if (shape[i][j]) {
        const newY = y + i;
        const newX = x + j;
        if (newY >= rows) return true;            // 아래 충돌
        if (newY < 0) continue;                    // 보드 위쪽은 허용
        if (newX < 0 || newX >= cols) return true; // 벽면 충돌
        if (board[newY][newX]) return true;        // 블록 충돌
      }
    }
  }
  return false;
}

function lock() {
  const { shape, x, y } = current;
  for (let i = 0; i < shape.length; i++) {
    for (let j = 0; j < shape[i].length; j++) {
      if (shape[i][j]) board[y + i][x + j] = 1;
    }
  }
}

function clearLines() {
  for (let i = rows - 1; i >= 0; i--) {
    if (board[i].every(c => c)) {
      board.splice(i, 1);
      board.unshift(Array(cols).fill(0));
      score += 10;
      i++;
    }
  }
  for (let j = 0; j < cols; j++) {
    let full = true;
    for (let i = 0; i < rows; i++) {
      if (!board[i][j]) { full = false; break; }
    }
    if (full) {
      for (let i = 0; i < rows; i++) {
        board[i].splice(j, 1);
        board[i].unshift(0);
      }
      score += 10;
      j--;
    }
  }
}

function update() {
  if (!playing) return;
  if (Date.now() - lastDrop > dropSpeed) {
    lastDrop = Date.now();
    let { x, y, dx, dy, shape } = current;
    if (!collide(x + dx, y + dy, shape)) {
      current.x += dx; current.y += dy;
    } else {
      lock();
      clearLines();
      checkGameOverOnTop();
      spawnShape();
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (board[i][j]) {
        ctx.fillStyle = 'blue';
        ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
      }
      ctx.strokeStyle = 'lightgray';
      ctx.strokeRect(j * cellSize, i * cellSize, cellSize, cellSize);
    }
  }
  if (current) {
    let { shape, x, y } = current;
    ctx.fillStyle = 'red';
    for (let i = 0; i < shape.length; i++) {
      for (let j = 0; j < shape[i].length; j++) {
        if (shape[i][j]) {
          ctx.fillRect((x+j)*cellSize, (y+i)*cellSize, cellSize, cellSize);
          ctx.strokeStyle = 'white';
          ctx.strokeRect((x+j)*cellSize, (y+i)*cellSize, cellSize, cellSize);
        }
      }
    }
  }
  document.getElementById('score').innerText = '점수: ' + score;
  if (!playing) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2);
  }
}

document.addEventListener('keydown', e => {
  if (!current || !playing) return;
  // 하드 드롭: 스페이스바
  if (e.key === ' ' || e.code === 'Space') {
    hardDrop();
    return;
  }
  // 회전: 컨트롤키
  if (e.key === 'Control') {
    const { x, y, shape } = current;
    const newShape = rotate(shape);
    if (!collide(x, y, newShape)) current.shape = newShape;
    return;
  }
  const { x, y, shape, dir } = current;
  if (dir === 'down') {
    // 아래 낙하 방향: 좌우 이동 및 소프트 드롭
    if (e.key === 'ArrowLeft' && !collide(x - 1, y, shape)) current.x--;
    else if (e.key === 'ArrowRight' && !collide(x + 1, y, shape)) current.x++;
    else if (e.key === 'ArrowDown' && !collide(x, y + 1, shape)) current.y++;
  } else {
    // 좌우 낙하 방향: 상하 이동
    if (e.key === 'ArrowUp' && !collide(x, y - 1, shape)) current.y--;
    else if (e.key === 'ArrowDown' && !collide(x, y + 1, shape)) current.y++;
  }
});

function gameLoop() {
  update(); draw(); requestAnimationFrame(gameLoop);
}

window.onload = () => {
  startBtn.style.display = 'block';
  gameLoop();
};
