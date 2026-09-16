const canvas = document.getElementById("game-board");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("high-score");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");

const startButton = document.getElementById("start-button");
const pauseButton = document.getElementById("pause-button");
const restartButton = document.getElementById("restart-button");

const mobileButtons = document.querySelectorAll("[data-direction]");

const GRID_SIZE = 14;
const CELL_SIZE = canvas.width / GRID_SIZE;

const INITIAL_SPEED = 150;
const MIN_SPEED = 65;
const SPEED_STEP = 12;
const FOOD_PER_LEVEL = 5;

let snake = [];
let food = { x: 0, y: 0 };

let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };

let score = 0;
let highScore = Number(localStorage.getItem("snake-high-score")) || 0;

let gameLoop = null;
let speed = INITIAL_SPEED;

let isRunning = false;
let isPaused = false;
let gameOver = false;

highScoreElement.textContent = highScore;

function resetGame() {
    stopLoop();

    const center = Math.floor(GRID_SIZE / 2);

snake = [
    { x: center, y: center },
    { x: center - 1, y: center },
    { x: center - 2, y: center }
];

    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };

    score = 0;
    speed = INITIAL_SPEED;
    isPaused = false;
    gameOver = false;

    scoreElement.textContent = score;
    pauseButton.textContent = "Pause";

    createFood();
    draw();
}

function startGame() {
    resetGame();

    isRunning = true;
    pauseButton.disabled = false;

    hideOverlay();
    startLoop();
}

function restartGame() {
    startGame();
}

function startLoop() {
    stopLoop();

    gameLoop = setInterval(gameTick, speed);
}

function stopLoop() {
    if (gameLoop !== null) {
        clearInterval(gameLoop);
        gameLoop = null;
    }
}

function gameTick() {
    if (!isRunning || isPaused || gameOver) {
        return;
    }

    update();
    draw();
}

function update() {
    direction = nextDirection;

    const head = snake[0];

    const newHead = {
        x: head.x + direction.x,
        y: head.y + direction.y
    };

    // Les bords du plateau sont traversables :
    // sortir d'un côté fait réapparaître le serpent du côté opposé.
    if (newHead.x < 0) {
        newHead.x = GRID_SIZE - 1;
    } else if (newHead.x >= GRID_SIZE) {
        newHead.x = 0;
    }

    if (newHead.y < 0) {
        newHead.y = GRID_SIZE - 1;
    } else if (newHead.y >= GRID_SIZE) {
        newHead.y = 0;
    }

    const hitSelf = snake.some(
        segment => segment.x === newHead.x && segment.y === newHead.y
    );

    if (hitSelf) {
        endGame();
        return;
    }

    snake.unshift(newHead);

    if (newHead.x === food.x && newHead.y === food.y) {
        score += 1;
        scoreElement.textContent = score;

        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem("snake-high-score", String(highScore));
        }

        createFood();

        if (score % FOOD_PER_LEVEL === 0) {
            increaseSpeed();
        }
    } else {
        snake.pop();
    }
}

function increaseSpeed() {
    const newSpeed = Math.max(MIN_SPEED, speed - SPEED_STEP);

    if (newSpeed === speed) {
        return;
    }

    speed = newSpeed;

    if (isRunning && !isPaused && !gameOver) {
        startLoop();
    }
}

function createFood() {
    const freeCells = [];

    for (let y = 0; y < GRID_SIZE; y += 1) {
        for (let x = 0; x < GRID_SIZE; x += 1) {
            const occupied = snake.some(
                segment => segment.x === x && segment.y === y
            );

            if (!occupied) {
                freeCells.push({ x, y });
            }
        }
    }

    if (freeCells.length === 0) {
        winGame();
        return;
    }

    food = freeCells[Math.floor(Math.random() * freeCells.length)];
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawFood();
    drawSnake();
}

function drawSnake() {
    snake.forEach((segment, index) => {
        if (index === 0) {
            drawTurtleHead(segment);
        } else {
            drawTurtleShell(segment, index);
        }
    });
}

function drawTurtleShell(segment, index) {
    const padding = 3;
    const x = segment.x * CELL_SIZE + padding;
    const y = segment.y * CELL_SIZE + padding;
    const size = CELL_SIZE - padding * 2;

    // Couleurs mauve / violet
    const shellColor = index % 2 === 0 ? "#8d63c7" : "#a37be0";
    const shellDetail = "#cbb2f2";
    const outline = "#5d3d8c";

    // Corps / carapace
    ctx.fillStyle = shellColor;
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, 8);
    ctx.fill();

    // Contour
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Motif de carapace
    ctx.strokeStyle = shellDetail;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + size / 2, y + 4);
    ctx.lineTo(x + size / 2, y + size - 4);
    ctx.moveTo(x + 4, y + size / 2);
    ctx.lineTo(x + size - 4, y + size / 2);
    ctx.stroke();
}

function drawTurtleHead(segment) {
    const padding = 2;
    const x = segment.x * CELL_SIZE + padding;
    const y = segment.y * CELL_SIZE + padding;
    const size = CELL_SIZE - padding * 2;

    const shellColor = "#8d63c7";
    const shellLight = "#b391ea";
    const skinColor = "#c9b3f5";
    const outline = "#5d3d8c";

    // Carapace principale
    ctx.fillStyle = shellColor;
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, 8);
    ctx.fill();

    ctx.strokeStyle = outline;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Tête orientée selon la direction
    const cx = x + size / 2;
    const cy = y + size / 2;

    let headX = cx;
    let headY = cy;

    if (direction.x === 1) headX += size * 0.38;
    if (direction.x === -1) headX -= size * 0.38;
    if (direction.y === 1) headY += size * 0.38;
    if (direction.y === -1) headY -= size * 0.38;

    // Tête
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(headX, headY, size * 0.18, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Pattes
    const legRadius = size * 0.09;
    const legs = [
        [x + size * 0.18, y + size * 0.18],
        [x + size * 0.82, y + size * 0.18],
        [x + size * 0.18, y + size * 0.82],
        [x + size * 0.82, y + size * 0.82]
    ];

    ctx.fillStyle = skinColor;
    for (const [lx, ly] of legs) {
        ctx.beginPath();
        ctx.arc(lx, ly, legRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Yeux
    let eyeOffsetX = 0;
    let eyeOffsetY = 0;

    if (direction.x !== 0) {
        eyeOffsetY = 3;
    } else {
        eyeOffsetX = 3;
    }

    const forwardX = direction.x * 3;
    const forwardY = direction.y * 3;

    ctx.fillStyle = "#1a1423";
    for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(
            headX + forwardX + eyeOffsetX * side,
            headY + forwardY + eyeOffsetY * side,
            1.8,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    // Petit reflet/motif sur la carapace
    ctx.strokeStyle = shellLight;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + size / 2, y + 5);
    ctx.lineTo(x + size / 2, y + size - 5);
    ctx.moveTo(x + 5, y + size / 2);
    ctx.lineTo(x + size - 5, y + size / 2);
    ctx.stroke();
}

function drawFood() {
    const x = food.x * CELL_SIZE;
    const y = food.y * CELL_SIZE;

    const paperWidth = CELL_SIZE * 0.62;
    const paperHeight = CELL_SIZE * 0.8;

    const paperX = x + (CELL_SIZE - paperWidth) / 2;
    const paperY = y + (CELL_SIZE - paperHeight) / 2;

    // Feuille du bulletin
    ctx.fillStyle = "#f7f4ea";
    ctx.beginPath();
    ctx.roundRect(paperX, paperY, paperWidth, paperHeight, 3);
    ctx.fill();

    // Contour
    ctx.strokeStyle = "#5b5b5b";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Petit coin plié
    ctx.fillStyle = "#e8e1cf";
    ctx.beginPath();
    ctx.moveTo(paperX + paperWidth * 0.72, paperY);
    ctx.lineTo(paperX + paperWidth, paperY);
    ctx.lineTo(paperX + paperWidth, paperY + paperHeight * 0.22);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#5b5b5b";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(paperX + paperWidth * 0.72, paperY);
    ctx.lineTo(paperX + paperWidth * 0.72, paperY + paperHeight * 0.22);
    ctx.lineTo(paperX + paperWidth, paperY + paperHeight * 0.22);
    ctx.stroke();

    // Lignes du bulletin pour donner l'effet "papier imprimé"
    ctx.strokeStyle = "#8a8a8a";
    ctx.lineWidth = 1;

    const lineStartX = paperX + paperWidth * 0.18;
    const lineEndX = paperX + paperWidth * 0.82;

    for (let i = 0; i < 3; i++) {
        const lineY = paperY + paperHeight * (0.28 + i * 0.18);

        ctx.beginPath();
        ctx.moveTo(lineStartX, lineY);
        ctx.lineTo(lineEndX, lineY);
        ctx.stroke();
    }
}

function setDirection(newDirection) {
    if (!isRunning || isPaused || gameOver) {
        return;
    }

    const opposite =
        newDirection.x === -direction.x &&
        newDirection.y === -direction.y;

    if (opposite) {
        return;
    }

    nextDirection = newDirection;
}

function togglePause() {
    if (!isRunning || gameOver) {
        return;
    }

    isPaused = !isPaused;

    if (isPaused) {
        pauseButton.textContent = "Reprendre";

        showOverlay(
            "Pause",
            "Appuie sur Espace ou sur « Reprendre » pour continuer.",
            "Reprendre"
        );
    } else {
        pauseButton.textContent = "Pause";
        hideOverlay();
    }
}

function endGame() {
    gameOver = true;
    isRunning = false;

    stopLoop();

    pauseButton.disabled = true;

    showOverlay(
        "Perdu ! Tortue melanchon a rencontré de méchant militants.",
        `Score : ${score}.`,
        "Rejouer"
    );
}

function winGame() {
    gameOver = true;
    isRunning = false;

    stopLoop();

    pauseButton.disabled = true;

    showOverlay(
        "Victoire ! Tortue Melanchon est président en 2027.",
        `Tu as récupérer tous les bulletins ${score}.`,
        "Rejouer"
    );
}

function showOverlay(title, text, buttonLabel) {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    startButton.textContent = buttonLabel;

    overlay.classList.remove("hidden");
}

function hideOverlay() {
    overlay.classList.add("hidden");
}

document.addEventListener("keydown", event => {
    const key = event.key.toLowerCase();

    const controls = {
        arrowup: { x: 0, y: -1 },
        z: { x: 0, y: -1 },

        arrowdown: { x: 0, y: 1 },
        s: { x: 0, y: 1 },

        arrowleft: { x: -1, y: 0 },
        q: { x: -1, y: 0 },

        arrowright: { x: 1, y: 0 },
        d: { x: 1, y: 0 }
    };

    if (controls[key]) {
        event.preventDefault();
        setDirection(controls[key]);
        return;
    }

    if (event.code === "Space") {
        event.preventDefault();
        togglePause();
    }
});

mobileButtons.forEach(button => {
    button.addEventListener("click", () => {
        const directionName = button.dataset.direction;

        const directions = {
            up: { x: 0, y: -1 },
            down: { x: 0, y: 1 },
            left: { x: -1, y: 0 },
            right: { x: 1, y: 0 }
        };

        setDirection(directions[directionName]);
    });
});

startButton.addEventListener("click", () => {
    if (isPaused) {
        togglePause();
    } else {
        startGame();
    }
});

pauseButton.addEventListener("click", togglePause);
restartButton.addEventListener("click", restartGame);

resetGame();
