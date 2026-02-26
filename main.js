const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const playerScoreEl = document.getElementById("player-score");
const cpuScoreEl = document.getElementById("cpu-score");
const statusEl = document.getElementById("status");

const btnPause = document.getElementById("btn-pause");
const btnReset = document.getElementById("btn-reset");
const btnExit = document.getElementById("btn-exit");
const btnResume = document.getElementById("btn-resume");
const btnOverlayReset = document.getElementById("btn-overlay-reset");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayMessage = document.getElementById("overlay-message");

const schemeWsBtn = document.getElementById("scheme-ws");
const schemeArrowsBtn = document.getElementById("scheme-arrows");
const difficultySelect = document.getElementById("difficulty-select");

const world = {
  width: canvas.width,
  height: canvas.height,
};

const paddle = {
  width: 16,
  height: 90,
  speed: 6.4,
};

const ballDefaults = {
  radius: 9,
  speed: 6.2,
};

const difficulties = {
  easy: { ballSpeed: 5.2, aiReaction: 0.06, aiMaxSpeed: 4.2 },
  normal: { ballSpeed: 6.2, aiReaction: 0.08, aiMaxSpeed: 5.2 },
  hard: { ballSpeed: 7.4, aiReaction: 0.11, aiMaxSpeed: 6.4 },
};

const state = {
  running: false,
  paused: false,
  exited: false,
  matchOver: false,
  controlScheme: "ws",
  playerScore: 0,
  cpuScore: 0,
  difficulty: "normal",
};

const match = {
  winScore: 7,
};

const player = {
  x: 40,
  y: world.height / 2 - paddle.height / 2,
  vy: 0,
};

const cpu = {
  x: world.width - 40 - paddle.width,
  y: world.height / 2 - paddle.height / 2,
  vy: 0,
};

const ball = {
  x: world.width / 2,
  y: world.height / 2,
  vx: 0,
  vy: 0,
  radius: ballDefaults.radius,
};

function resetBall(direction = 1) {
  ball.x = world.width / 2;
  ball.y = world.height / 2;
  const angle = (Math.random() * Math.PI) / 4 - Math.PI / 8;
  const speed = ballDefaults.speed;
  ball.vx = Math.cos(angle) * speed * direction;
  ball.vy = Math.sin(angle) * speed;
}

function resetPositions() {
  player.y = world.height / 2 - paddle.height / 2;
  cpu.y = world.height / 2 - paddle.height / 2;
  player.vy = 0;
  cpu.vy = 0;
}

function resetGame() {
  state.playerScore = 0;
  state.cpuScore = 0;
  resetPositions();
  resetBall(Math.random() > 0.5 ? 1 : -1);
  updateScore();
  setStatus(`First to ${match.winScore}. Press Space to start.`);
  state.running = false;
  state.paused = false;
  state.exited = false;
  state.matchOver = false;
  hideOverlay();
}

function exitGame() {
  state.running = false;
  state.paused = false;
  state.exited = true;
  state.matchOver = false;
  showOverlay("Game exited", "Press Space or Resume to jump back in.");
  setStatus("Exited");
}

function startGame() {
  if (state.matchOver) {
    showOverlay("Match over", "Press Reset to start a new match.");
    setStatus("Match over");
    return;
  }
  if (state.exited) {
    state.exited = false;
  }
  state.running = true;
  state.paused = false;
  hideOverlay();
  setStatus("Playing");
}

function togglePause() {
  if (state.matchOver) {
    showOverlay("Match over", "Press Reset to start a new match.");
    setStatus("Match over");
    return;
  }
  if (!state.running && !state.exited) {
    startGame();
    return;
  }
  if (state.exited) {
    startGame();
    return;
  }
  state.paused = !state.paused;
  if (state.paused) {
    showOverlay("Paused", "Press Space or click Resume to continue.");
    setStatus("Paused");
  } else {
    hideOverlay();
    setStatus("Playing");
  }
}

function showOverlay(title, message) {
  overlayTitle.textContent = title;
  overlayMessage.textContent = message;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function setStatus(text) {
  statusEl.textContent = text;
}

function updateScore() {
  playerScoreEl.textContent = state.playerScore;
  cpuScoreEl.textContent = state.cpuScore;
}

function endMatch(winner) {
  state.running = false;
  state.paused = false;
  state.matchOver = true;
  showOverlay(
    `${winner} wins`,
    `First to ${match.winScore}. Press Reset to play again.`
  );
  setStatus("Match over");
}

function checkWinner() {
  if (state.playerScore >= match.winScore) {
    endMatch("You");
  } else if (state.cpuScore >= match.winScore) {
    endMatch("CPU");
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function handlePaddleMovement() {
  player.y += player.vy;
  player.y = clamp(player.y, 0, world.height - paddle.height);

  const target = ball.y - paddle.height / 2;
  const diff = target - cpu.y;
  const reaction = difficulties[state.difficulty].aiReaction;
  cpu.vy = diff * reaction;
  cpu.vy = clamp(
    cpu.vy,
    -difficulties[state.difficulty].aiMaxSpeed,
    difficulties[state.difficulty].aiMaxSpeed
  );
  cpu.y += cpu.vy;
  cpu.y = clamp(cpu.y, 0, world.height - paddle.height);
}

function handleBallMovement() {
  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= world.height) {
    ball.vy *= -1;
  }

  if (
    ball.x - ball.radius <= player.x + paddle.width &&
    ball.y >= player.y &&
    ball.y <= player.y + paddle.height &&
    ball.vx < 0
  ) {
    const collidePoint = ball.y - (player.y + paddle.height / 2);
    const normalized = collidePoint / (paddle.height / 2);
    const bounceAngle = (Math.PI / 4) * normalized;
    ball.vx = Math.cos(bounceAngle) * ballDefaults.speed;
    ball.vy = Math.sin(bounceAngle) * ballDefaults.speed;
  }

  if (
    ball.x + ball.radius >= cpu.x &&
    ball.y >= cpu.y &&
    ball.y <= cpu.y + paddle.height &&
    ball.vx > 0
  ) {
    const collidePoint = ball.y - (cpu.y + paddle.height / 2);
    const normalized = collidePoint / (paddle.height / 2);
    const bounceAngle = (Math.PI / 4) * normalized;
    ball.vx = -Math.cos(bounceAngle) * ballDefaults.speed;
    ball.vy = Math.sin(bounceAngle) * ballDefaults.speed;
  }

  if (ball.x + ball.radius < 0) {
    state.cpuScore += 1;
    updateScore();
    resetPositions();
    resetBall(1);
    checkWinner();
  }

  if (ball.x - ball.radius > world.width) {
    state.playerScore += 1;
    updateScore();
    resetPositions();
    resetBall(-1);
    checkWinner();
  }
}

function drawCourt() {
  ctx.clearRect(0, 0, world.width, world.height);

  ctx.fillStyle = "#f1f3f6";
  ctx.fillRect(0, 0, world.width, world.height);

  ctx.strokeStyle = "rgba(16, 18, 22, 0.08)";
  ctx.setLineDash([8, 12]);
  ctx.beginPath();
  ctx.moveTo(world.width / 2, 20);
  ctx.lineTo(world.width / 2, world.height - 20);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#111318";
  ctx.fillRect(player.x, player.y, paddle.width, paddle.height);

  ctx.fillStyle = "#5a616d";
  ctx.fillRect(cpu.x, cpu.y, paddle.width, paddle.height);

  ctx.beginPath();
  ctx.fillStyle = "#0f1114";
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
}

function gameLoop() {
  if (state.running && !state.paused) {
    handlePaddleMovement();
    handleBallMovement();
  }
  drawCourt();
  requestAnimationFrame(gameLoop);
}

const keyState = {
  up: false,
  down: false,
};

function updatePlayerVelocity() {
  if (keyState.up && !keyState.down) {
    player.vy = -paddle.speed;
  } else if (keyState.down && !keyState.up) {
    player.vy = paddle.speed;
  } else {
    player.vy = 0;
  }
}

function setControlScheme(scheme) {
  state.controlScheme = scheme;
  schemeWsBtn.classList.toggle("active", scheme === "ws");
  schemeArrowsBtn.classList.toggle("active", scheme === "arrows");
  keyState.up = false;
  keyState.down = false;
  updatePlayerVelocity();
}

function setDifficulty(value) {
  if (!difficulties[value]) {
    return;
  }
  state.difficulty = value;
  ballDefaults.speed = difficulties[value].ballSpeed;
  if (!state.running || state.paused || state.matchOver || state.exited) {
    resetBall(Math.random() > 0.5 ? 1 : -1);
  }
}

function handleKeyDown(event) {
  const key = event.key.toLowerCase();
  const code = event.code;

  if (code === "Space" || code === "ArrowUp" || code === "ArrowDown") {
    event.preventDefault();
  }

  if (key === "p") {
    togglePause();
    return;
  }

  if (key === "r") {
    resetGame();
    return;
  }

  if (key === "escape") {
    exitGame();
    return;
  }

  if (code === "Space") {
    if (!state.running || state.paused || state.exited) {
      startGame();
    }
    return;
  }

  if (state.controlScheme === "ws") {
    if (key === "w") {
      keyState.up = true;
    }
    if (key === "s") {
      keyState.down = true;
    }
  }

  if (state.controlScheme === "arrows") {
    if (code === "ArrowUp") {
      keyState.up = true;
    }
    if (code === "ArrowDown") {
      keyState.down = true;
    }
  }

  updatePlayerVelocity();
}

function handleKeyUp(event) {
  const key = event.key.toLowerCase();
  const code = event.code;

  if (state.controlScheme === "ws") {
    if (key === "w") {
      keyState.up = false;
    }
    if (key === "s") {
      keyState.down = false;
    }
  }

  if (state.controlScheme === "arrows") {
    if (code === "ArrowUp") {
      keyState.up = false;
    }
    if (code === "ArrowDown") {
      keyState.down = false;
    }
  }

  updatePlayerVelocity();
}

schemeWsBtn.addEventListener("click", () => setControlScheme("ws"));
schemeArrowsBtn.addEventListener("click", () => setControlScheme("arrows"));
difficultySelect.addEventListener("change", (event) =>
  setDifficulty(event.target.value)
);

btnPause.addEventListener("click", togglePause);
btnReset.addEventListener("click", resetGame);
btnExit.addEventListener("click", exitGame);
btnResume.addEventListener("click", startGame);
btnOverlayReset.addEventListener("click", resetGame);

window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);

resetGame();
setDifficulty("normal");
gameLoop();
