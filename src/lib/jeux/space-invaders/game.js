// @ts-nocheck — jeu écrit en JavaScript simple, servi tel quel : pas vérifié par TypeScript.
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const livesElement = document.getElementById("lives");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const startButton = document.getElementById("startButton");

const keys = {};

let running = false;
let score = 0;
let lives = 3;
let lastTime = 0;
let enemyDirection = 1;
let enemySpeed = 55;
let enemyShootTimer = 0;
let enemyShootDelay = 1.1;
let wave = 1;
let damageFlash = 0;

const stars = Array.from({ length: 95 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  r: Math.random() * 1.5 + 0.3,
  speed: Math.random() * 16 + 5
}));

const player = {
  x: canvas.width / 2 - 28,
  y: canvas.height - 60,
  width: 56,
  height: 28,
  speed: 430,
  cooldown: 0,
  tilt: 0
};

let playerBullets = [];
let enemyBullets = [];
let invaders = [];
let boss = null;
let bossShootTimer = 0;
let meteorites = [];

function createInvaders() {
  invaders = [];
  boss = null;

  // Toutes les 10 vagues : BOSS
  if (wave % 10 === 0) {
    createBoss();
    return;
  }

  invaders = [];

  const rows = 5;
  const cols = 10;
  const width = 44;
  const height = 30;
  const gapX = 22;
  const gapY = 18;

  const formationWidth = cols * width + (cols - 1) * gapX;
  const startX = (canvas.width - formationWidth) / 2;
  const startY = 70;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let hp = 1;

// À partir de la vague 21,
// 30 % de chances d'avoir 2 PV
if (wave > 20 && Math.random() < 0.30) {
  hp = 2;
}

invaders.push({
  x: startX + col * (width + gapX),
  y: startY + row * (height + gapY),
  width,
  height,
  row,

  hp: hp,
  maxHp: hp,

  alive: true
});
    }
  }
}

function createMeteorites() {
  meteorites = [];

  // Pas de météorites avant la vague 10
  if (wave < 10) return;

  const y = canvas.height - 250;

  const positions = [
    canvas.width * 0.25,
    canvas.width * 0.50,
    canvas.width * 0.75
  ];

  for (const x of positions) {
    meteorites.push({
      x: x - 35,
      y: y,
      width: 70,
      height: 55,
      rotation: Math.random() * Math.PI * 2
    });
  }
}

function createBoss() {
  const maxHp = 30 + wave * 2;

  boss = {
    x: canvas.width / 2 - 80,
    y: 70,

    width: 160,
    height: 70,

    speed: 110 + wave * 2,
    direction: 1,

    hp: maxHp,
    maxHp: maxHp,

    // Tous les boss à partir de la vague 20 sont blindés
    armored: wave >= 20
  };

  bossShootTimer = 0;
}

function updateBoss(dt) {
  if (!boss) return;

  boss.x += boss.speed * boss.direction * dt;

  if (boss.x <= 10) {
    boss.x = 10;
    boss.direction = 1;
  }

  if (boss.x + boss.width >= canvas.width - 10) {
    boss.x = canvas.width - boss.width - 10;
    boss.direction = -1;
  }
}

function drawDamageFlash() {
  if (damageFlash <= 0) return;

  ctx.fillStyle = "rgba(255, 60, 60, 0.35)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function resetGame() {
  score = 0;
  lives = 3;
  wave = 1;

  scoreElement.textContent = score;
  livesElement.textContent = lives;

  player.x = canvas.width / 2 - player.width / 2;
  player.cooldown = 0;

  playerBullets = [];
  enemyBullets = [];

  enemyDirection = 1;
  enemySpeed = 55;
  enemyShootTimer = 0;
  enemyShootDelay = 1.1;

  createInvaders();
  createMeteorites();
}

function startGame() {
  resetGame();

  overlay.classList.add("hidden");
  running = true;
  lastTime = performance.now();

  requestAnimationFrame(gameLoop);
}

function nextWave() {
  wave += 1;
  enemyDirection = 1;
  enemySpeed = Math.min(145, 55 + wave * 12);
  enemyShootDelay = Math.max(0.35, 1.1 - wave * 0.08);

  playerBullets = [];
  enemyBullets = [];

  createInvaders();
  createMeteorites();
}

function endGame(message) {
  running = false;

  overlayTitle.textContent = "Partie terminée";
  overlayText.innerHTML = `${message}<br><br>Score : <strong>${score}</strong>`;
  startButton.textContent = "Rejouer";

  overlay.classList.remove("hidden");
}

function update(dt) {
  updateStars(dt);
  updatePlayer(dt);
  updatePlayerBullets(dt);

  updateInvaders(dt);
  updateBoss(dt);

  updateEnemyBullets(dt);
  updateEnemyShooting(dt);
  checkCollisions();

  if (damageFlash > 0) {
    damageFlash -= dt;
  }

  if (!boss && invaders.every(invader => !invader.alive)) {
    nextWave();
  }
}

function updateStars(dt) {
  const speedMultiplier = enemySpeed / 55;

  for (const star of stars) {
    star.y += star.speed * speedMultiplier * dt;

    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width;
    }
  }
}

function updatePlayer(dt) {
  let direction = 0;

  if (keys["ArrowLeft"] || keys["KeyA"]) direction -= 1;
  if (keys["ArrowRight"] || keys["KeyD"]) direction += 1;

  player.x += direction * player.speed * dt;

  if (player.x < 0) player.x = 0;

  if (player.x + player.width > canvas.width) {
    player.x = canvas.width - player.width;
  }

  // Inclinaison du vaisseau
  const maxTilt = 0.18;

  let targetTilt = 0;

  if (direction < 0) {
    targetTilt = -maxTilt;
  }

  if (direction > 0) {
    targetTilt = maxTilt;
  }

  player.tilt += (targetTilt - player.tilt) * 8 * dt;

  player.cooldown -= dt;

  if (player.cooldown <= 0) {
    shootPlayerBullet();
    player.cooldown = 0.28;
  }
}

function shootPlayerBullet() {
  const centerX = player.x + player.width / 2 - 2;

  // Tir principal vertical
playerBullets.push({
  x: centerX,
  y: player.y - 10,
  width: 4,
  height: 14,

  vx: 0,
  vy: -560,

  // À partir de la vague 25 : 2 dégâts
  damage: wave >= 25 ? 2 : 1,

  // Permet de reconnaître le tir central
  central: true
});

  // Pour le test :
  // 1 nouveau tir diagonal toutes les 3 vagues
  const extraShots = Math.min(Math.floor(wave / 3), 4);

  for (let i = 0; i < extraShots; i++) {

  const direction = i % 2 === 0 ? 1 : -1;

  const level = Math.floor(i / 2) + 1;

  playerBullets.push({
    x: centerX,
    y: player.y - 10,
    width: 4,
    height: 14,

    vx: 140 * level * direction,
    vy: -520,

    // Les tirs diagonaux font toujours 1 dégât
    damage: 1,

    // Ce ne sont pas des tirs centraux
    central: false
  });
}
}

function updatePlayerBullets(dt) {
  for (const bullet of playerBullets) {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
  }

  playerBullets = playerBullets.filter(bullet =>
    bullet.y + bullet.height > 0 &&
    bullet.x + bullet.width > 0 &&
    bullet.x < canvas.width
  );
}

function updateInvaders(dt) {
  const aliveInvaders = invaders.filter(invader => invader.alive);
  if (aliveInvaders.length === 0) return;

  let shouldDrop = false;

  for (const invader of aliveInvaders) {
    const nextX = invader.x + enemyDirection * enemySpeed * dt;

    if (nextX <= 8 || nextX + invader.width >= canvas.width - 8) {
      shouldDrop = true;
      break;
    }
  }

  if (shouldDrop) {
    enemyDirection *= -1;

    for (const invader of aliveInvaders) {
      invader.y += 20;

      if (invader.y + invader.height >= player.y) {
        endGame("Les envahisseurs ont atteint ta position.");
        return;
      }
    }
  } else {
    for (const invader of aliveInvaders) {
      invader.x += enemyDirection * enemySpeed * dt;
    }
  }
}

function updateEnemyShooting(dt) {

  // --------------------
  // BOSS
  // --------------------

  if (boss) {
    bossShootTimer -= dt;

    if (bossShootTimer <= 0) {
      shootBoss();
      bossShootTimer = 0.8;
    }

    return;
  }


  // --------------------
  // ENNEMIS NORMAUX
  // --------------------

  enemyShootTimer -= dt;

  if (enemyShootTimer > 0) return;

  const shooters = getBottomInvaders();

  if (shooters.length > 0) {
    const shooter =
      shooters[Math.floor(Math.random() * shooters.length)];

    enemyBullets.push({
      x: shooter.x + shooter.width / 2 - 2,
      y: shooter.y + shooter.height,

      width: 4,
      height: 14,

      vx: 0,
      speed: 230 + wave * 10
    });
  }

  enemyShootTimer =
    enemyShootDelay * (0.75 + Math.random() * 0.55);
}

function shootBoss() {
  if (!boss) return;

  const centerX =
    boss.x + boss.width / 2 - 3;

  const startY =
    boss.y + boss.height;

  // Tir central
  enemyBullets.push({
    x: centerX,
    y: startY,

    width: 6,
    height: 18,

    vx: 0,
    speed: 300
  });

  // Diagonale gauche
  enemyBullets.push({
    x: centerX,
    y: startY,

    width: 6,
    height: 18,

    vx: -180,
    speed: 270
  });

  // Diagonale droite
  enemyBullets.push({
    x: centerX,
    y: startY,

    width: 6,
    height: 18,

    vx: 180,
    speed: 270
  });
}

function getBottomInvaders() {
  const byColumn = new Map();

  for (const invader of invaders) {
    if (!invader.alive) continue;

    const columnKey = Math.round(invader.x / 10);
    const existing = byColumn.get(columnKey);

    if (!existing || invader.y > existing.y) {
      byColumn.set(columnKey, invader);
    }
  }

  // Comme la formation bouge en bloc, les X restent suffisamment proches
  // pour obtenir une sélection variée des envahisseurs les plus bas.
  const alive = invaders.filter(invader => invader.alive);
  const candidates = [];

  for (const invader of alive) {
    const centerX = invader.x + invader.width / 2;
    const blockedBelow = alive.some(other => {
      if (other === invader) return false;

      const otherCenterX = other.x + other.width / 2;

      return Math.abs(otherCenterX - centerX) < invader.width / 2 &&
             other.y > invader.y;
    });

    if (!blockedBelow) candidates.push(invader);
  }

  return candidates;
}

function updateEnemyBullets(dt) {
  for (const bullet of enemyBullets) {

    bullet.x += (bullet.vx || 0) * dt;
    bullet.y += bullet.speed * dt;
  }

  enemyBullets = enemyBullets.filter(bullet =>
    bullet.y < canvas.height + 20 &&
    bullet.x > -50 &&
    bullet.x < canvas.width + 50
  );
}

function checkCollisions() {

  // =====================================================
  // 1. COLLISIONS AVEC LES MÉTÉORITES
  // =====================================================

  // Tirs du joueur
  for (const bullet of playerBullets) {
    for (const meteorite of meteorites) {

      if (rectsOverlap(bullet, meteorite)) {
        bullet.hit = true;
        break;
      }
    }
  }

  playerBullets = playerBullets.filter(
    bullet => !bullet.hit
  );


  // Tirs ennemis
  for (const bullet of enemyBullets) {
    for (const meteorite of meteorites) {

      if (rectsOverlap(bullet, meteorite)) {
        bullet.hit = true;
        break;
      }
    }
  }

  enemyBullets = enemyBullets.filter(
    bullet => !bullet.hit
  );


  // =====================================================
  // 2. TIRS DU JOUEUR SUR LE BOSS
  // =====================================================

  if (boss) {

    for (const bullet of playerBullets) {

      if (rectsOverlap(bullet, boss)) {

        bullet.hit = true;

        // Sécurité : 1 dégât si aucune valeur n'est définie
        const damage = bullet.damage ?? 1;


        // Le blindage absorbe complètement le premier tir
        if (boss.armored) {

          boss.armored = false;

        } else {

          boss.hp -= damage;
        }


        // Points pour avoir touché le boss
        score += 20;
        scoreElement.textContent = score;


        // Boss détruit
        if (boss.hp <= 0) {

          boss = null;

          // Bonus de destruction
          score += 1000;
          scoreElement.textContent = score;


          // Le joueur récupère une vie
          // Maximum : 3 vies
          lives = Math.min(lives + 1, 3);
          livesElement.textContent = lives;


          // Nettoyage des tirs
          playerBullets = [];
          enemyBullets = [];


          // Passage à la vague suivante
          nextWave();

          return;
        }


        // Une balle ne peut toucher qu'une seule fois
        break;
      }
    }

    playerBullets = playerBullets.filter(
      bullet => !bullet.hit
    );
  }


  // =====================================================
  // 3. TIRS DU JOUEUR SUR LES ALIENS
  // =====================================================

  for (const bullet of playerBullets) {

    for (const invader of invaders) {

      if (!invader.alive) continue;


      if (rectsOverlap(bullet, invader)) {

        bullet.hit = true;

        // Tir normal = 1 dégât
        // Tir central rouge après vague 25 = 2 dégâts
        const damage = bullet.damage ?? 1;

        invader.hp -= damage;


        // L'alien meurt uniquement quand ses PV arrivent à 0
        if (invader.hp <= 0) {

          invader.alive = false;

          const rowBonus =
            (5 - invader.row) * 10;

          score += rowBonus;
          scoreElement.textContent = score;
        }


        // La balle s'arrête sur cet alien
        break;
      }
    }
  }


  // Suppression des tirs ayant touché un alien
  playerBullets = playerBullets.filter(
    bullet => !bullet.hit
  );


  // =====================================================
  // 4. TIRS ENNEMIS SUR LE JOUEUR
  // =====================================================

  for (const bullet of enemyBullets) {

    if (rectsOverlap(bullet, player)) {

      bullet.hit = true;

      lives -= 1;
      livesElement.textContent = lives;


      // Flash rouge
      damageFlash = 0.18;


      // Plus aucune vie
      if (lives <= 0) {

        endGame(
          "Ton vaisseau a été détruit."
        );

        return;
      }
    }
  }


  // Suppression des tirs ennemis ayant touché le joueur
  enemyBullets = enemyBullets.filter(
    bullet => !bullet.hit
  );
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();
  drawPlayer();
  drawInvaders();

  drawBoss();

  drawPlayerBullets();
  drawEnemyBullets();
  drawWave();
  drawDamageFlash();
  drawMeteorites();
}

function drawMeteorites() {
  for (const meteorite of meteorites) {

    ctx.save();

    ctx.translate(
      meteorite.x + meteorite.width / 2,
      meteorite.y + meteorite.height / 2
    );

    ctx.rotate(meteorite.rotation);

    ctx.fillStyle = "#716b70";

    ctx.beginPath();

    ctx.moveTo(-32, -10);
    ctx.lineTo(-20, -25);
    ctx.lineTo(5, -28);
    ctx.lineTo(30, -12);
    ctx.lineTo(34, 10);
    ctx.lineTo(20, 25);
    ctx.lineTo(-5, 28);
    ctx.lineTo(-30, 15);

    ctx.closePath();
    ctx.fill();


    // Cratères
    ctx.fillStyle = "#4e494d";

    ctx.beginPath();
    ctx.arc(-12, -7, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(14, 8, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(8, -14, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

function drawBoss() {
  if (!boss) return;

  ctx.save();

  ctx.translate(boss.x, boss.y);

  ctx.fillStyle = "#ff4f73";

  // Corps
  ctx.fillRect(
    20,
    15,
    boss.width - 40,
    boss.height - 20
  );

  // Ailes
  ctx.fillRect(
    0,
    30,
    boss.width,
    20
  );

  // Partie centrale
  ctx.fillStyle = "#ffb347";

  ctx.fillRect(
    boss.width / 2 - 30,
    5,
    60,
    35
  );

  // Yeux
  ctx.fillStyle = "#ffffff";

  ctx.fillRect(48, 28, 12, 10);
  ctx.fillRect(boss.width - 60, 28, 12, 10);
  if (boss.armored) {
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;

  ctx.strokeRect(
    -5,
    0,
    boss.width + 10,
    boss.height
  );
}

  ctx.restore();


  // BARRE DE VIE

  const barWidth = 300;
  const barHeight = 14;

  const x =
    canvas.width / 2 - barWidth / 2;

  const y = 20;

  ctx.fillStyle = "#333";
  ctx.fillRect(
    x,
    y,
    barWidth,
    barHeight
  );

  ctx.fillStyle = "#ff4f73";

  ctx.fillRect(
    x,
    y,
    barWidth * (boss.hp / boss.maxHp),
    barHeight
  );

  ctx.strokeStyle = "#ffffff";
  ctx.strokeRect(
    x,
    y,
    barWidth,
    barHeight
  );
  
}

function drawBackground() {
  ctx.fillStyle = "#02040b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const star of stars) {
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer() {
  ctx.save();

ctx.translate(
  player.x + player.width / 2,
  player.y + player.height / 2
);

ctx.rotate(player.tilt);

ctx.translate(
  -player.width / 2,
  -player.height / 2
);

  ctx.fillStyle = "#8cf7ff";

  ctx.beginPath();
  ctx.moveTo(player.width / 2, 0);
  ctx.lineTo(player.width, player.height);
  ctx.lineTo(player.width * 0.66, player.height * 0.78);
  ctx.lineTo(player.width * 0.34, player.height * 0.78);
  ctx.lineTo(0, player.height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#1c6f86";
  ctx.fillRect(
    player.width / 2 - 6,
    player.height * 0.42,
    12,
    player.height * 0.38
  );

  ctx.restore();
}

function drawInvaders() {
  for (const invader of invaders) {
    if (!invader.alive) continue;

    const palette = [
      "#ff6b9c",
      "#ff8f70",
      "#ffd166",
      "#9cff86",
      "#a78bfa"
    ];

    ctx.save();
    ctx.translate(invader.x, invader.y);

    ctx.fillStyle = palette[invader.row % palette.length];

    ctx.fillRect(7, 4, invader.width - 14, 6);
    ctx.fillRect(3, 10, invader.width - 6, 12);
    ctx.fillRect(8, 22, 8, 6);
    ctx.fillRect(invader.width - 16, 22, 8, 6);

    ctx.fillStyle = "#02040b";

    ctx.fillRect(12, 13, 5, 5);
    ctx.fillRect(invader.width - 17, 13, 5, 5);

    // Contour uniquement s'il reste 2 PV
    if (invader.hp === 2) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;

      ctx.strokeRect(
        1,
        2,
        invader.width - 2,
        invader.height - 2
      );
    }

    ctx.restore();
  }
}

function drawPlayerBullets() {
  for (const bullet of playerBullets) {

    // Tir central amélioré à partir de la vague 25
    if (bullet.central && bullet.damage === 2) {
      ctx.fillStyle = "#ff3030";
    } else {
      ctx.fillStyle = "#f7ff68";
    }

    ctx.fillRect(
      bullet.x,
      bullet.y,
      bullet.width,
      bullet.height
    );
  }
}

function drawEnemyBullets() {
  ctx.fillStyle = "#ff4f73";

  for (const bullet of enemyBullets) {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  }
}

function drawWave() {
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "18px Arial";
  ctx.textAlign = "right";
  ctx.fillText(`Vague ${wave}`, canvas.width - 18, canvas.height - 18);
}

function gameLoop(time) {
  if (!running) return;

  const dt = Math.min((time - lastTime) / 1000, 0.033);
  lastTime = time;

  update(dt);
  draw();

  if (running) {
    requestAnimationFrame(gameLoop);
  }
}

window.addEventListener("keydown", event => {
  if (
    event.code === "ArrowLeft" ||
    event.code === "ArrowRight" ||
    event.code === "Space"
  ) {
    event.preventDefault();
  }

  keys[event.code] = true;
});

window.addEventListener("keyup", event => {
  keys[event.code] = false;
});

startButton.addEventListener("click", () => {
  overlayTitle.textContent = "Space Invaders";
  startButton.textContent = "Jouer";
  startGame();
});

draw();
