const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const hpEl = document.getElementById("hp");
const maxHpEl = document.getElementById("maxHp");
const shieldEl = document.getElementById("shield");
const xpEl = document.getElementById("xp");
const xpNeedEl = document.getElementById("xpNeed");
const levelEl = document.getElementById("level");
const scoreEl = document.getElementById("score");

const upgradePanel = document.getElementById("upgradePanel");
const upgradeHp = document.getElementById("upgradeHp");
const upgradeHeal = document.getElementById("upgradeHeal");
const upgradeShot = document.getElementById("upgradeShot");
const upgradeShield = document.getElementById("upgradeShield");
const shotUpgradeTitle = document.getElementById("shotUpgradeTitle");
const shotUpgradeText = document.getElementById("shotUpgradeText");
const shieldUpgradeText = document.getElementById("shieldUpgradeText");

const gameOverPanel = document.getElementById("gameOverPanel");
const finalScoreEl = document.getElementById("finalScore");
const restartButton = document.getElementById("restartButton");

const keys = {};
let lastTime = 0;
let paused = false;
let gameOver = false;
let enemySpawnTimer = 0;
let obstacleSpawnTimer = 0;
let damageFlash = 0;
let boss = null;
let pendingBoss = false;
let bossesDefeated = 0;
let fireRateBoostTimer = 0;

let nextSideWaveFromLeft = true;
let playerRecoil = 0;
let screenShake = 0;

let comboCount = 0;
let comboTimer = 0;
const comboWindow = 2.5;
const comboMax = 5;

const player = {
  x: canvas.width / 2,
  y: canvas.height - 90,
  width: 34,
  height: 42,
  speed: 280,
  hp: 8,
  maxHp: 8,
  shield: 0,
  shots: 1,
  damage: 1,
  drones: 0,
  fireCooldown: 0,
  fireRate: 0.18,
  invulnerability: 0
};

let bullets = [];
let enemies = [];
let enemyBullets = [];
let obstacles = [];
let particles = [];
let drops = [];
let stars = [];
let score = 0;
let level = 1;
let xp = 0;
let xpNeeded = 6;

function resetStars() {
  stars = [];
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: 30 + Math.random() * 110,
      size: Math.random() * 2 + 0.5
    });
  }
}

function updateHud() {
  hpEl.textContent = player.hp;
  maxHpEl.textContent = player.maxHp;
  shieldEl.textContent = player.shield;
  xpEl.textContent = xp;
  xpNeedEl.textContent = xpNeeded;
  levelEl.textContent = level;
  scoreEl.textContent = score;
}

function resetGame() {
  player.x = canvas.width / 2;
  player.y = canvas.height - 90;
  player.hp = 8;
  player.maxHp = 8;
  player.shield = 0;
  player.shots = 1;
  player.damage = 1;
  player.drones = 0;
  player.fireCooldown = 0;
  player.invulnerability = 0;

  bullets = [];
  enemies = [];
  enemyBullets = [];
  obstacles = [];
  particles = [];
  drops = [];

  score = 0;
  level = 1;
  xp = 0;
  xpNeeded = 6;
  enemySpawnTimer = 0;
  obstacleSpawnTimer = 0;
  damageFlash = 0;
  boss = null;
  pendingBoss = false;
  bossesDefeated = 0;
  fireRateBoostTimer = 0;

  nextSideWaveFromLeft = true;
  playerRecoil = 0;
  screenShake = 0;

  comboCount = 0;
  comboTimer = 0;

  paused = false;
  gameOver = false;

  upgradePanel.classList.add("hidden");
  gameOverPanel.classList.add("hidden");
  resetStars();
  updateHud();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rectsOverlap(a, b) {
  return (
    a.x - a.width / 2 < b.x + b.width / 2 &&
    a.x + a.width / 2 > b.x - b.width / 2 &&
    a.y - a.height / 2 < b.y + b.height / 2 &&
    a.y + a.height / 2 > b.y - b.height / 2
  );
}

function circleRectOverlap(circle, rect) {
  const left = rect.x - rect.width / 2;
  const right = rect.x + rect.width / 2;
  const top = rect.y - rect.height / 2;
  const bottom = rect.y + rect.height / 2;

  const closestX = clamp(circle.x, left, right);
  const closestY = clamp(circle.y, top, bottom);

  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy < circle.radius * circle.radius;
}

function createExplosion(x, y, amount = 12) {
  for (let i = 0; i < amount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 150;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.3 + Math.random() * 0.5,
      size: 1 + Math.random() * 3
    });
  }
}

function shoot() {
  if (player.fireCooldown > 0 || paused || gameOver) return;

  const bulletSpeed = 520;
  const straightSpacing = 12;

  // 1 tir : central.
  if (player.shots === 1) {
    bullets.push({
      x: player.x,
      y: player.y - player.height / 2,
      width: 5,
      height: 14,
      vx: 0,
      vy: -bulletSpeed,
      damage: player.damage
    });
  }

  // 2 tirs : parallèles et droits.
  else if (player.shots === 2) {
    for (const offset of [-straightSpacing / 2, straightSpacing / 2]) {
      bullets.push({
        x: player.x + offset,
        y: player.y - player.height / 2,
        width: 5,
        height: 14,
        vx: 0,
        vy: -bulletSpeed,
        damage: 1
      });
    }
  }

  // À partir de 3 tirs : les projectiles supplémentaires partent en diagonale.
  else {
    const diagonalCount = player.shots - 2;

    // Si le nombre total est pair, on garde 2 tirs droits.
    // S'il est impair, on garde 1 tir droit central.
    const straightCount = player.shots % 2 === 0 ? 2 : 1;

    if (straightCount === 1) {
      bullets.push({
        x: player.x,
        y: player.y - player.height / 2,
        width: 5,
        height: 14,
        vx: 0,
        vy: -bulletSpeed,
        damage: player.damage
      });
    } else {
      for (const offset of [-straightSpacing / 2, straightSpacing / 2]) {
        bullets.push({
          x: player.x + offset,
          y: player.y - player.height / 2,
          width: 5,
          height: 14,
          vx: 0,
          vy: -bulletSpeed,
          damage: 1
        });
      }
    }

    // Les tirs restants sont répartis symétriquement à gauche et à droite.
    const pairCount = Math.floor((player.shots - straightCount) / 2);

    for (let i = 1; i <= pairCount; i++) {
      const angle = (12 + (i - 1) * 8) * Math.PI / 180;
      const vx = Math.sin(angle) * bulletSpeed;
      const vy = -Math.cos(angle) * bulletSpeed;

      bullets.push({
        x: player.x,
        y: player.y - player.height / 2,
        width: 5,
        height: 14,
        vx: -vx,
        vy,
        damage: 1
      });

      bullets.push({
        x: player.x,
        y: player.y - player.height / 2,
        width: 5,
        height: 14,
        vx,
        vy,
        damage: 1
      });
    }
  }

  // Les drones tirent eux aussi droit devant.
  for (let i = 0; i < player.drones; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const row = Math.floor(i / 2);
    const droneX = player.x + side * (34 + row * 18);

    bullets.push({
      x: droneX,
      y: player.y - 2,
      width: 4,
      height: 12,
      vx: 0,
      vy: -bulletSpeed,
      damage: 1,
      fromDrone: true
    });
  }

  playerRecoil = Math.min(6, playerRecoil + 2.2);

  player.fireCooldown =
    fireRateBoostTimer > 0
      ? player.fireRate * 0.55
      : player.fireRate;
}

function createEnemy(side, forcedX = null, forcedY = null, forcedPattern = null) {
  const size = 30 + Math.random() * 12;

  let x;
  let y;
  let baseDirection;

  if (side === 0) {
    x = forcedX ?? (50 + Math.random() * (canvas.width - 100));
    y = forcedY ?? -40;
    baseDirection = "down";
  } else if (side === 1) {
    x = forcedX ?? -40;
    y = forcedY ?? (70 + Math.random() * (canvas.height * 0.55));
    baseDirection = "right";
  } else {
    x = forcedX ?? (canvas.width + 40);
    y = forcedY ?? (70 + Math.random() * (canvas.height * 0.55));
    baseDirection = "left";
  }

  // 5 trajectoires possibles : droite, sinusoïde, zigzag,
  // traversée rapide ou dérive progressive.
  const movementPattern =
    forcedPattern !== null
      ? forcedPattern
      : Math.floor(Math.random() * 5);

  // Les ennemis spéciaux deviennent progressivement plus fréquents.
  const greenChance =
    bossesDefeated >= 1
      ? Math.min(0.60, 0.25 + bossesDefeated * 0.05)
      : 0;

  const armoredChance =
    bossesDefeated >= 3
      ? Math.min(0.55, 0.20 + (bossesDefeated - 2) * 0.05)
      : 0;

  const isGreen = Math.random() < greenChance;
  const enemyHp = Math.random() < armoredChance ? 2 : 1;

  enemies.push({
    x,
    y,
    width: size,
    height: size,
    // La vitesse augmente doucement avec le niveau, sans dépasser un bonus de 55 %.
    speed:
      (85 + Math.random() * 45) *
      Math.min(1.55, 1 + Math.max(0, level - 1) * 0.012),
    hp: enemyHp,
    maxHp: enemyHp,
    type: isGreen ? "green" : "normal",

    // Ennemi vert OU ennemi à 2 PV = 3 XP, ennemi normal = 2 XP.
    xpReward: isGreen || enemyHp > 1 ? 3 : 2,

    fireTimer:
      bossesDefeated >= 1
        ? Math.max(0.18, 0.42 - level * 0.004) + Math.random() * 0.45
        : 0.9 + Math.random() * 1.6,

    baseDirection,
    movementPattern,
    movementTime: Math.random() * Math.PI * 2,
    waveAmplitude: 18 + Math.random() * 26,
    waveSpeed: 1.5 + Math.random() * 1.4,
    zigzagDirection: Math.random() < 0.5 ? -1 : 1,
    zigzagTimer: 0.25 + Math.random() * 0.35,
    driftDirection: Math.random() < 0.5 ? -1 : 1
  });
}

function spawnVFormation() {
  // Formation de 5 ennemis en V venant du haut.
  // On force une trajectoire droite pour conserver la formation.
  const centerX = 120 + Math.random() * (canvas.width - 240);

  const positions = [
    { x: centerX,      y: -45 },
    { x: centerX - 45, y: -78 },
    { x: centerX + 45, y: -78 },
    { x: centerX - 90, y: -111 },
    { x: centerX + 90, y: -111 }
  ];

  for (const position of positions) {
    createEnemy(0, position.x, position.y, 0);
  }
}

function spawnSideWave() {
  // Après le troisième boss, les vagues latérales alternent :
  // gauche -> droite, puis droite -> gauche, etc.
  const fromLeft = nextSideWaveFromLeft;
  nextSideWaveFromLeft = !nextSideWaveFromLeft;

  const side = fromLeft ? 1 : 2;
  const x = fromLeft ? -45 : canvas.width + 45;

  const yPositions =
    level >= 40
      ? [75, 125, 175, 225, 275]
      : [95, 155, 215, 275];

  for (const y of yPositions) {
    // Une légère sinusoïde garde la vague lisible sans être trop statique.
    createEnemy(side, x, y, 1);
  }
}

function spawnEnemy() {
  // Niveau 30+ : petite chance d'avoir deux groupes simultanés.
  // Une formation descend du haut pendant qu'une vague arrive sur le côté.
  if (level >= 30 && Math.random() < Math.min(0.16, 0.08 + (level - 30) * 0.002)) {
    spawnVFormation();
    spawnSideWave();
    return "combinedWave";
  }

  const sideWaveChance =
    bossesDefeated >= 3
      ? Math.min(0.34, 0.16 + (bossesDefeated - 2) * 0.03)
      : 0;

  const vFormationChance =
    bossesDefeated >= 2
      ? Math.min(0.38, 0.18 + (bossesDefeated - 1) * 0.03)
      : 0;

  if (Math.random() < sideWaveChance) {
    spawnSideWave();
    return "sideWave";
  }

  if (Math.random() < vFormationChance) {
    spawnVFormation();
    return "vFormation";
  }

  // Sinon apparition classique d'un seul ennemi.
  const side = Math.floor(Math.random() * 3);
  createEnemy(side);
  return "single";
}

function isBossLevel(currentLevel) {
  return currentLevel === 5 || (currentLevel >= 10 && currentLevel % 10 === 0);
}

function spawnBoss() {
  // Le numéro du boss dépend simplement du nombre de boss déjà vaincus.
  // Boss 1 au niveau 5, Boss 2 au niveau 10, Boss 3 au niveau 20, etc.
  const bossNumber = bossesDefeated + 1;
  const maxHp = 28 + (bossNumber - 1) * 14;

  // On nettoie les ennemis ordinaires pour créer une vraie phase de boss.
  enemies = [];
  enemyBullets = [];

  const baseSpeed = 95;
  const baseFireRate = Math.max(0.45, 0.85 - (bossNumber - 1) * 0.04);

  boss = {
    x: canvas.width / 2,
    y: -70,
    width: 150,
    height: 78,
    hp: maxHp,
    maxHp,
    targetY: 90,

    baseSpeed,
    speed: baseSpeed,

    direction: 1,

    fireTimer: 0.18,
    baseFireRate,
    fireRate: baseFireRate,

    phase: 1,
    phaseTime: 0,

    number: bossNumber
  };
}

function bossShoot() {
  if (!boss) return;

  const dx = player.x - boss.x;
  const dy = player.y - boss.y;
  const baseAngle = Math.atan2(dy, dx);

  let offsets;
  let bulletSpeed;

  // Phase 1 : 100 % à 60 % de PV
  // 3 tirs dirigés vers le joueur.
  if (boss.phase === 1) {
    offsets = [-0.24, 0, 0.24];
    bulletSpeed = 210;
  }

  // Phase 2 : 60 % à 30 % de PV
  // 5 tirs en éventail, un peu plus rapides.
  else if (boss.phase === 2) {
    offsets = [-0.36, -0.18, 0, 0.18, 0.36];
    bulletSpeed = 235;
  }

  // Phase 3 : moins de 30 % de PV
  // 7 tirs en éventail et projectiles encore plus rapides.
  else {
    offsets = [-0.48, -0.32, -0.16, 0, 0.16, 0.32, 0.48];
    bulletSpeed = 260;
  }

  for (const offset of offsets) {
    const angle = baseAngle + offset;

    enemyBullets.push({
      x: boss.x,
      y: boss.y + boss.height / 2,
      radius: 5,
      vx: Math.cos(angle) * bulletSpeed,
      vy: Math.sin(angle) * bulletSpeed
    });
  }
}

function updateBoss(dt) {
  if (!boss) return;

  boss.phaseTime += dt;

  const hpRatio = boss.hp / boss.maxHp;

  // Changement de phase en fonction des PV restants.
  if (hpRatio > 0.60) {
    boss.phase = 1;
    boss.speed = boss.baseSpeed;
    boss.fireRate = boss.baseFireRate;
  } else if (hpRatio > 0.30) {
    boss.phase = 2;
    boss.speed = boss.baseSpeed * 1.30;
    boss.fireRate = Math.max(0.36, boss.baseFireRate * 0.78);
  } else {
    boss.phase = 3;
    boss.speed = boss.baseSpeed * 1.60;
    boss.fireRate = Math.max(0.26, boss.baseFireRate * 0.58);
  }

  // Le boss commence à tirer dès qu'il devient visible.
  if (boss.y < boss.targetY) {
    boss.y += boss.speed * dt;
  } else {
    // Mouvement horizontal scripté.
    boss.x += boss.direction * boss.speed * dt;

    // En phase 3, le boss ajoute une légère oscillation verticale.
    if (boss.phase === 3) {
      boss.y = boss.targetY + Math.sin(boss.phaseTime * 2.4) * 18;
    } else {
      boss.y += (boss.targetY - boss.y) * Math.min(1, dt * 6);
    }

    const margin = boss.width / 2 + 18;

    if (boss.x <= margin) {
      boss.x = margin;
      boss.direction = 1;
    } else if (boss.x >= canvas.width - margin) {
      boss.x = canvas.width - margin;
      boss.direction = -1;
    }
  }

  if (boss.y + boss.height / 2 >= 0) {
    boss.fireTimer -= dt;

    if (boss.fireTimer <= 0) {
      bossShoot();
      boss.fireTimer = boss.fireRate;
    }
  }

  if (rectsOverlap(boss, player)) {
    damagePlayer(1);
  }
}

function drawBoss() {
  if (!boss) return;

  ctx.save();
  ctx.translate(boss.x, boss.y);

  ctx.fillStyle = "#a14cff";
  ctx.beginPath();
  ctx.moveTo(-boss.width / 2, -boss.height / 3);
  ctx.lineTo(-boss.width * 0.34, boss.height / 2);
  ctx.lineTo(0, boss.height * 0.25);
  ctx.lineTo(boss.width * 0.34, boss.height / 2);
  ctx.lineTo(boss.width / 2, -boss.height / 3);
  ctx.lineTo(boss.width * 0.22, -boss.height / 2);
  ctx.lineTo(0, -boss.height * 0.3);
  ctx.lineTo(-boss.width * 0.22, -boss.height / 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#f3d9ff";
  ctx.fillRect(-18, -10, 36, 18);

  ctx.restore();

  // Barre de vie du boss.
  const barWidth = Math.min(420, canvas.width - 100);
  const barHeight = 12;
  const x = (canvas.width - barWidth) / 2;
  const y = 16;
  const ratio = Math.max(0, boss.hp / boss.maxHp);

  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(x, y, barWidth, barHeight);
  ctx.fillStyle = "#b966ff";
  ctx.fillRect(x, y, barWidth * ratio, barHeight);
  ctx.strokeStyle = "rgba(255,255,255,0.65)";
  ctx.strokeRect(x, y, barWidth, barHeight);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 13px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`BOSS ${boss.number} — PHASE ${boss.phase} — ${Math.max(0, boss.hp)} / ${boss.maxHp} PV`, canvas.width / 2, y + 29);
}

function spawnObstacle() {
  const radius = 22 + Math.random() * 24;
  obstacles.push({
    x: 60 + Math.random() * (canvas.width - 120),
    y: -radius - 20,
    radius,
    speed: 45 + Math.random() * 45,
    drift: -25 + Math.random() * 50,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: -1 + Math.random() * 2
  });
}

function enemyShoot(enemy) {
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const len = Math.hypot(dx, dy) || 1;
  const vx = (dx / len) * 180;
  const vy = (dy / len) * 180;

  if (enemy.type === "green") {
    // Double tir légèrement espacé.
    const perpX = -dy / len;
    const perpY = dx / len;
    const spread = 10;

    for (const side of [-1, 1]) {
      enemyBullets.push({
        x: enemy.x + perpX * spread * side,
        y: enemy.y + perpY * spread * side,
        radius: 4,
        vx,
        vy
      });
    }
  } else {
    enemyBullets.push({
      x: enemy.x,
      y: enemy.y,
      radius: 4,
      vx,
      vy
    });
  }
}

function damagePlayer(amount = 1) {
  if (player.invulnerability > 0 || gameOver) return;

  // Les drones servent aussi de protection : un impact détruit d'abord un drone.
  if (player.drones > 0) {
    player.drones -= 1;
  } else if (player.shield > 0) {
    player.shield -= 1;
  } else {
    player.hp -= amount;
  }

  player.invulnerability = 0.85;
  damageFlash = 0.16;
  createExplosion(player.x, player.y, 10);
  updateHud();

  if (player.hp <= 0) {
    endGame();
  }
}

function maybeSpawnDrop(x, y) {
  // 8 % de chance de lâcher un bonus à la mort d'un ennemi.
  if (Math.random() >= 0.08) return;

  const types = ["heal", "shield", "invulnerability", "firerate"];
  const type = types[Math.floor(Math.random() * types.length)];

  drops.push({
    x,
    y,
    width: 18,
    height: 18,
    speed: 95,
    type,
    rotation: 0
  });
}

function applyDrop(drop) {
  if (drop.type === "heal") {
    player.hp = Math.min(player.maxHp, player.hp + 1);
  }

  else if (drop.type === "shield") {
    player.shield = Math.min(5, player.shield + 1);
  }

  else if (drop.type === "invulnerability") {
    player.invulnerability = Math.max(player.invulnerability, 3);
  }

  else if (drop.type === "firerate") {
    fireRateBoostTimer = 5;
  }

  updateHud();
}

function updateDrops(dt) {
  for (const drop of drops) {
    drop.y += drop.speed * dt;
    drop.rotation += dt * 2.5;

    if (rectsOverlap(drop, player)) {
      drop.dead = true;
      applyDrop(drop);
    }
  }

  drops = drops.filter(drop =>
    !drop.dead &&
    drop.y < canvas.height + 40
  );
}

function drawDrops() {
  for (const drop of drops) {
    ctx.save();
    ctx.translate(drop.x, drop.y);
    ctx.rotate(drop.rotation);

    if (drop.type === "heal") {
      ctx.fillStyle = "#ff6b6b";
    } else if (drop.type === "shield") {
      ctx.fillStyle = "#55cfff";
    } else if (drop.type === "invulnerability") {
      ctx.fillStyle = "#ffd95c";
    } else {
      ctx.fillStyle = "#c56bff";
    }

    ctx.fillRect(-drop.width / 2, -drop.height / 2, drop.width, drop.height);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (drop.type === "heal") {
      ctx.fillText("+", 0, 0);
    } else if (drop.type === "shield") {
      ctx.fillText("S", 0, 0);
    } else if (drop.type === "invulnerability") {
      ctx.fillText("I", 0, 0);
    } else {
      ctx.fillText("F", 0, 0);
    }

    ctx.restore();
  }
}

function gainXp(amount) {
  // L'XP gagnée ne change pas avec le combo.
  xp += amount;

  // Chaque élimination rapprochée augmente le multiplicateur de score.
  comboCount = Math.min(comboMax, comboCount + 1);
  comboTimer = comboWindow;

  score += amount * 10 * comboCount;

  if (xp >= xpNeeded) {
    xp -= xpNeeded;
    level += 1;
    // Progression plus régulière :
    // +2 XP requis par niveau, avec un plafond à 40 XP.
    xpNeeded = Math.min(40, xpNeeded + 2);

    if (isBossLevel(level)) {
      pendingBoss = true;
    }

    openUpgradePanel();
  }

  updateHud();
}

function openUpgradePanel() {
  paused = true;

  // PV maximum plafonnés à 5.
  upgradeHp.disabled = player.maxHp >= 15;

  // Le soin reste disponible même à 5 PV max,
  // mais pas si le joueur est déjà à pleine vie.
  upgradeHeal.disabled = player.hp >= player.maxHp;

  // Bouclier plafonné à 5 PV.
  upgradeShield.disabled = player.shield >= 5;
  shieldUpgradeText.textContent =
    player.shield >= 5
      ? "Bouclier au maximum (5/5)."
      : `Ajoute 1 PV de bouclier (${player.shield}/5 actuellement).`;

if (player.shots < 5) {
  upgradeShot.disabled = false;
  shotUpgradeTitle.textContent = "+1 projectile";
  shotUpgradeText.textContent = `Ajoute un projectile (${player.shots}/5 actuellement).`;
} else if (player.damage < 2) {
  upgradeShot.disabled = false;
  shotUpgradeTitle.textContent = "+1 dégât central";
  shotUpgradeText.textContent = "Seul le tir central passera à 2 dégâts.";
} else {
  upgradeShot.disabled = player.drones >= 5;
  shotUpgradeTitle.textContent = "+1 drone";
  shotUpgradeText.textContent =
    player.drones >= 5
      ? "Nombre maximum de drones atteint (5/5)."
      : `Ajoute un drone (${player.drones}/5 actuellement).`;
  }

  upgradePanel.classList.remove("hidden");
}

function closeUpgradePanel() {
  upgradePanel.classList.add("hidden");

  // Petite période de grâce après une amélioration pour éviter
  // de reprendre immédiatement un dégât à la reprise du jeu.
  player.invulnerability = Math.max(player.invulnerability, 2);

  if (pendingBoss && !boss) {
    pendingBoss = false;
    spawnBoss();
  }

  paused = false;
  updateHud();
}

upgradeHp.addEventListener("click", () => {
  if (player.maxHp >= 15) return;
  player.maxHp += 1;
  player.hp = Math.min(player.maxHp, player.hp + 1);
  closeUpgradePanel();
});

upgradeHeal.addEventListener("click", () => {
  if (player.hp >= player.maxHp) return;
  player.hp = Math.min(player.maxHp, player.hp + 1);
  closeUpgradePanel();
});

upgradeShot.addEventListener("click", () => {
  if (player.shots < 5) {
    player.shots += 1;
  } else if (player.damage < 2) {
    player.damage = 2;
  } else if (player.drones < 5) {
    player.drones += 1;
  }

  closeUpgradePanel();
});

upgradeShield.addEventListener("click", () => {
  if (player.shield >= 5) return;
  player.shield = Math.min(5, player.shield + 1);
  closeUpgradePanel();
});

function endGame() {
  gameOver = true;
  paused = true;
  finalScoreEl.textContent = score;
  gameOverPanel.classList.remove("hidden");
}

restartButton.addEventListener("click", resetGame);

function updateStars(dt) {
  for (const star of stars) {
    star.y += star.speed * dt;

    if (star.y > canvas.height) {
      star.y = -4;
      star.x = Math.random() * canvas.width;
    }
  }
}

function updatePlayer(dt) {
  let dx = 0;
  let dy = 0;

  if (keys["ArrowLeft"] || keys["q"] || keys["a"]) dx -= 1;
  if (keys["ArrowRight"] || keys["d"]) dx += 1;
  if (keys["ArrowUp"] || keys["z"] || keys["w"]) dy -= 1;
  if (keys["ArrowDown"] || keys["s"]) dy += 1;

  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    dx /= len;
    dy /= len;
  }

  player.x += dx * player.speed * dt;
  player.y += dy * player.speed * dt;

  player.x = clamp(player.x, player.width / 2, canvas.width - player.width / 2);
  player.y = clamp(player.y, player.height / 2, canvas.height - player.height / 2);

  player.fireCooldown = Math.max(0, player.fireCooldown - dt);
  player.invulnerability = Math.max(0, player.invulnerability - dt);

  shoot();
}

function updateBullets(dt) {
  for (const bullet of bullets) {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
  }

  bullets = bullets.filter(bullet =>
    bullet.y > -30 &&
    bullet.x > -40 &&
    bullet.x < canvas.width + 40
  );
}

function updateEnemies(dt) {
  if (boss) {
    updateBoss(dt);
    return;
  }

  enemySpawnTimer -= dt;

  if (enemySpawnTimer <= 0) {
    const spawnType = spawnEnemy();

    if (spawnType === "combinedWave") {
      enemySpawnTimer = 2.35 + Math.random() * 0.55;
    } else if (spawnType === "vFormation") {
      enemySpawnTimer = Math.max(1.25, 2.2 - level * 0.012) + Math.random() * 0.55;
    } else if (spawnType === "sideWave") {
      enemySpawnTimer = Math.max(1.15, 2.0 - level * 0.012) + Math.random() * 0.5;
    } else {
      enemySpawnTimer =
        Math.max(0.38, 1.25 - level * 0.018) +
        Math.random() * Math.max(0.18, 0.42 - level * 0.004);
    }
  }

  for (const enemy of enemies) {
    enemy.movementTime += dt * enemy.waveSpeed;

    let vx = 0;
    let vy = 0;

    if (enemy.baseDirection === "down") {
      vy = enemy.speed;
    } else if (enemy.baseDirection === "right") {
      vx = enemy.speed;
    } else if (enemy.baseDirection === "left") {
      vx = -enemy.speed;
    }

    // 0 : ligne droite
    if (enemy.movementPattern === 0) {
      enemy.x += vx * dt;
      enemy.y += vy * dt;
    }

    // 1 : sinusoide
    else if (enemy.movementPattern === 1) {
      enemy.x += vx * dt;
      enemy.y += vy * dt;

      if (enemy.baseDirection === "down") {
        enemy.x += Math.sin(enemy.movementTime) * enemy.waveAmplitude * dt;
      } else {
        enemy.y += Math.sin(enemy.movementTime) * enemy.waveAmplitude * dt;
      }
    }

    // 2 : zigzag plus marque
    else if (enemy.movementPattern === 2) {
      enemy.zigzagTimer -= dt;

      if (enemy.zigzagTimer <= 0) {
        enemy.zigzagDirection *= -1;
        enemy.zigzagTimer = 0.25 + Math.random() * 0.35;
      }

      enemy.x += vx * dt;
      enemy.y += vy * dt;

      const zigzagSpeed = enemy.waveAmplitude * 2.2;

      if (enemy.baseDirection === "down") {
        enemy.x += enemy.zigzagDirection * zigzagSpeed * dt;
      } else {
        enemy.y += enemy.zigzagDirection * zigzagSpeed * dt;
      }
    }

    // 3 : traversee rapide
    else if (enemy.movementPattern === 3) {
      enemy.x += vx * 1.55 * dt;
      enemy.y += vy * 1.55 * dt;
    }

    // 4 : derive progressive vers un cote
    else if (enemy.movementPattern === 4) {
      enemy.x += vx * dt;
      enemy.y += vy * dt;

      const driftSpeed = enemy.waveAmplitude * 0.9;

      if (enemy.baseDirection === "down") {
        enemy.x += enemy.driftDirection * driftSpeed * dt;
      } else {
        enemy.y += enemy.driftDirection * driftSpeed * dt;
      }
    }

    enemy.fireTimer -= dt;

    if (enemy.fireTimer <= 0) {
      enemyShoot(enemy);

      if (enemy.type === "green") {
        // Les verts restent plus lisibles que les normaux malgré leur double tir.
        enemy.fireTimer =
          Math.max(0.62, 1.2 - level * 0.012) +
          Math.random() * 0.48;
      } else if (bossesDefeated >= 1) {
        enemy.fireTimer =
          Math.max(0.42, 0.82 - level * 0.009) +
          Math.random() * 0.5;
      } else {
        enemy.fireTimer = 1.5 + Math.random() * 1.5;
      }
    }

    if (rectsOverlap(enemy, player)) {
      enemy.hp = 0;
      damagePlayer(1);
      createExplosion(enemy.x, enemy.y, 16);
    }

    if (
      enemy.y > canvas.height + 100 ||
      enemy.y < -140 ||
      enemy.x < -140 ||
      enemy.x > canvas.width + 140
    ) {
      enemy.hp = 0;
    }
  }

  enemies = enemies.filter(enemy => enemy.hp > 0);
}

function updateEnemyBullets(dt) {
  for (const bullet of enemyBullets) {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;

    if (circleRectOverlap(bullet, player)) {
      bullet.dead = true;
      damagePlayer(1);
    }
  }

  enemyBullets = enemyBullets.filter(bullet =>
    !bullet.dead &&
    bullet.x > -30 &&
    bullet.x < canvas.width + 30 &&
    bullet.y > -30 &&
    bullet.y < canvas.height + 30
  );
}

function updateObstacles(dt) {
  obstacleSpawnTimer -= dt;

  if (obstacleSpawnTimer <= 0) {
    spawnObstacle();
    obstacleSpawnTimer = 2.8 + Math.random() * 2.2;
  }

  for (const obstacle of obstacles) {
    obstacle.y += obstacle.speed * dt;
    obstacle.x += obstacle.drift * dt;
    obstacle.rotation += obstacle.rotationSpeed * dt;

    if (circleRectOverlap(obstacle, player)) {
      obstacle.dead = true;
      damagePlayer(1);
      createExplosion(obstacle.x, obstacle.y, 18);
    }
  }

  obstacles = obstacles.filter(obstacle =>
    !obstacle.dead &&
    obstacle.y < canvas.height + obstacle.radius + 20
  );
}

function handleCollisions() {
  for (const bullet of bullets) {
    if (!bullet.dead && boss && boss.hp > 0 && rectsOverlap(bullet, boss)) {
      bullet.dead = true;
      boss.hp -= bullet.damage;

      if (boss.hp <= 0) {
        createExplosion(boss.x, boss.y, 60);
        screenShake = 0.55;
        score += 500 * boss.number;
        bossesDefeated += 1;
        boss = null;
        enemySpawnTimer = 1.2;
        updateHud();

        // Chaque boss vaincu offre immédiatement une amélioration bonus.
        openUpgradePanel();
      }
    }

    for (const enemy of enemies) {
      if (!bullet.dead && enemy.hp > 0 && rectsOverlap(bullet, enemy)) {
        bullet.dead = true;
        enemy.hp -= bullet.damage;

        if (enemy.hp <= 0) {
          createExplosion(enemy.x, enemy.y, enemy.maxHp > 1 ? 28 : 16);
          maybeSpawnDrop(enemy.x, enemy.y);
          gainXp(enemy.xpReward || 1);
        }
      }
    }

    for (const obstacle of obstacles) {
      if (!bullet.dead && !obstacle.dead && circleRectOverlap(obstacle, bullet)) {
        bullet.dead = true;
      }
    }
  }

  bullets = bullets.filter(bullet => !bullet.dead);
  enemies = enemies.filter(enemy => enemy.hp > 0);
}

function updateParticles(dt) {
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  }

  particles = particles.filter(p => p.life > 0);
}

function update(dt) {
  updateStars(dt);
  damageFlash = Math.max(0, damageFlash - dt);
  fireRateBoostTimer = Math.max(0, fireRateBoostTimer - dt);
  playerRecoil = Math.max(0, playerRecoil - 22 * dt);
  screenShake = Math.max(0, screenShake - dt);

  if (comboTimer > 0) {
    comboTimer = Math.max(0, comboTimer - dt);

    if (comboTimer <= 0) {
      comboCount = 0;
    }
  }

  if (paused) {
    updateParticles(dt);
    return;
  }

  updatePlayer(dt);
  updateBullets(dt);
  updateEnemies(dt);
  updateEnemyBullets(dt);
  updateObstacles(dt);
  updateDrops(dt);
  handleCollisions();
  updateParticles(dt);
}

function drawStars() {
  ctx.fillStyle = "#ffffff";
  for (const star of stars) {
    ctx.globalAlpha = 0.35 + star.size / 3;
    ctx.fillRect(star.x, star.y, star.size, star.size * 2.2);
  }
  ctx.globalAlpha = 1;
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y + playerRecoil);

  if (player.invulnerability > 0 && Math.floor(player.invulnerability * 14) % 2 === 0) {
    ctx.globalAlpha = 0.35;
  }

  ctx.fillStyle = "#71d9ff";
  ctx.beginPath();
  ctx.moveTo(0, -player.height / 2);
  ctx.lineTo(-player.width / 2, player.height / 2);
  ctx.lineTo(0, player.height / 3);
  ctx.lineTo(player.width / 2, player.height / 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-3, -8, 6, 16);

  ctx.fillStyle = "#ff7d5c";
  ctx.beginPath();
  ctx.moveTo(-8, player.height / 2 - 3);
  ctx.lineTo(0, player.height / 2 + 13 + Math.random() * 7);
  ctx.lineTo(8, player.height / 2 - 3);
  ctx.fill();

  if (player.shield > 0) {
    ctx.strokeStyle = "rgba(91, 219, 255, 0.85)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 31, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawDrones() {
  for (let i = 0; i < player.drones; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const row = Math.floor(i / 2);
    const x = player.x + side * (34 + row * 18);
    const y = player.y + 3;

    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = "#4da6ff";
    ctx.fillRect(-7, -7, 14, 14);

    ctx.fillStyle = "#d9efff";
    ctx.fillRect(-2, -5, 4, 5);

    ctx.restore();
  }
}

function drawBullets() {
  for (const bullet of bullets) {
    if (!bullet.fromDrone && bullet.damage >= 2) {
      ctx.fillStyle = "#57e6ff";
    } else if (bullet.fromDrone) {
      ctx.fillStyle = "#8fc8ff";
    } else {
      ctx.fillStyle = "#f3f6ff";
    }

    ctx.fillRect(
      bullet.x - bullet.width / 2,
      bullet.y - bullet.height / 2,
      bullet.width,
      bullet.height
    );
  }
}

function drawEnemies() {
  for (const enemy of enemies) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    const isArmored = enemy.maxHp > 1;

    // Les ennemis blindés (2 PV) sont légèrement plus gros visuellement.
    const visualScale = isArmored ? 1.16 : 1;
    ctx.scale(visualScale, visualScale);

    // Priorité visuelle :
    // - orange = ennemi blindé 2 PV
    // - vert = ennemi à double tir
    // - rouge = ennemi normal
    if (isArmored) {
      ctx.fillStyle = "#f29b38";
    } else if (enemy.type === "green") {
      ctx.fillStyle = "#59d46f";
    } else {
      ctx.fillStyle = "#ff5d75";
    }

    ctx.beginPath();
    ctx.moveTo(0, enemy.height / 2);
    ctx.lineTo(-enemy.width / 2, -enemy.height / 2);
    ctx.lineTo(0, -enemy.height / 4);
    ctx.lineTo(enemy.width / 2, -enemy.height / 2);
    ctx.closePath();
    ctx.fill();

    // Cockpit / détail central.
    if (isArmored) {
      ctx.fillStyle = "#ffe0a8";
    } else if (enemy.type === "green") {
      ctx.fillStyle = "#ddffe3";
    } else {
      ctx.fillStyle = "#ffd8df";
    }

    ctx.fillRect(-4, -6, 8, 12);

    // Marquage supplémentaire sur les ennemis blindés.
    if (isArmored) {
      ctx.strokeStyle = "#fff2cf";
      ctx.lineWidth = 2;
      ctx.strokeRect(-enemy.width * 0.23, -enemy.height * 0.28, enemy.width * 0.46, enemy.height * 0.56);
    }

    ctx.restore();

    // Les PV restent affichés à taille normale sous l'ennemi.
    if (isArmored) {
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`${enemy.hp} PV`, enemy.x, enemy.y + enemy.height / 2 + 18);
      ctx.restore();
    }
  }
}

function drawEnemyBullets() {
  ctx.fillStyle = "#ffb347";
  for (const bullet of enemyBullets) {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawObstacles() {
  for (const obstacle of obstacles) {
    ctx.save();
    ctx.translate(obstacle.x, obstacle.y);
    ctx.rotate(obstacle.rotation);

    ctx.fillStyle = "#6e7488";
    ctx.beginPath();

    const points = 10;
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const r = obstacle.radius * (0.75 + Math.random() * 0.25);
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#4d5264";
    ctx.beginPath();
    ctx.arc(-obstacle.radius * 0.22, -obstacle.radius * 0.08, obstacle.radius * 0.18, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

function drawParticles() {
  ctx.fillStyle = "#ffd27a";
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life * 2);
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

function drawCombo() {
  if (comboCount < 2 || comboTimer <= 0) return;

  ctx.save();

  ctx.textAlign = "right";
  ctx.textBaseline = "top";

  ctx.font = "bold 22px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`COMBO x${comboCount}`, canvas.width - 18, 18);

  // Petite barre indiquant le temps restant avant la perte du combo.
  const barWidth = 120;
  const barHeight = 5;
  const ratio = comboTimer / comboWindow;
  const x = canvas.width - 18 - barWidth;
  const y = 47;

  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(x, y, barWidth, barHeight);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, barWidth * ratio, barHeight);

  ctx.restore();
}

function drawDamageFlash() {
  if (damageFlash <= 0) return;

  const intensity = damageFlash / 0.16;

  ctx.save();
  ctx.globalAlpha = 0.42 * intensity;
  ctx.fillStyle = "#ff4a4a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalAlpha = 0.18 * intensity;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#02040d");
  gradient.addColorStop(1, "#08142d");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();

  if (screenShake > 0) {
    const shakePower = 7 * (screenShake / 0.55);
    ctx.translate(
      (Math.random() - 0.5) * shakePower,
      (Math.random() - 0.5) * shakePower
    );
  }

  drawStars();
  drawObstacles();
  drawDrops();
  drawBullets();
  drawEnemies();
  drawBoss();
  drawEnemyBullets();
  drawPlayer();
  drawDrones();
  drawParticles();

  ctx.restore();

  drawCombo();
  drawDamageFlash();
}

function loop(timestamp) {
  const dt = Math.min(0.033, (timestamp - lastTime) / 1000 || 0);
  lastTime = timestamp;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

window.addEventListener("keydown", event => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

  if (
    ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(event.key)
  ) {
    event.preventDefault();
  }

  keys[key] = true;
});

window.addEventListener("keyup", event => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys[key] = false;
});

resetGame();
requestAnimationFrame(loop);
