const gameContainer = document.getElementById('game-container');
const player = document.getElementById('player');
const scoreElement = document.getElementById('score-value');
const healthElement = document.getElementById('health-value');
const waveElement = document.getElementById('wave-value');
const weaponElement = document.getElementById('weapon-value');
const gameOverScreen = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');
const upgradeMenu = document.getElementById('upgrade-menu');
const closeUpgradeMenuButton = document.getElementById('close-upgrade-menu');
const miniMap = document.getElementById('mini-map');

const shootSound = document.getElementById('shoot-sound');
const hitSound = document.getElementById('hit-sound');
const explosionSound = document.getElementById('explosion-sound');
const powerupSound = document.getElementById('powerup-sound');

let score = 0;
let health = 100;
let wave = 1;
let enemies = [];
let bullets = [];
let powerUps = [];
let particles = [];
let playerSpeed = 5;
let playerDamage = 1;
let gameLoop;
let waveTimeout;
let currentWeapon = 'pistol';

const weapons = {
    pistol: { damage: 1, fireRate: 500, bulletSpeed: 10 },
    shotgun: { damage: 1, fireRate: 1000, bulletSpeed: 8, bullets: 5, spread: 0.3 },
    machineGun: { damage: 0.5, fireRate: 100, bulletSpeed: 12 }
};

const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

function updateHUD() {
    scoreElement.textContent = score;
    healthElement.textContent = health;
    waveElement.textContent = wave;
    weaponElement.textContent = currentWeapon;
}

function createEnemy() {
    const enemy = document.createElement('div');
    enemy.classList.add('enemy');
    
    const enemyType = Math.random();
    let speed, health, size;
    
    if (enemyType < 0.6) {
        enemy.classList.add('enemy-normal');
        speed = 2;
        health = 1;
        size = 30;
    } else if (enemyType < 0.9) {
        enemy.classList.add('enemy-fast');
        speed = 3;
        health = 1;
        size = 25;
    } else {
        enemy.classList.add('enemy-tank');
        speed = 1;
        health = 3;
        size = 40;
    }
    
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    switch(side) {
        case 0: // Top
            x = Math.random() * window.innerWidth;
            y = -size;
            break;
        case 1: // Right
            x = window.innerWidth + size;
            y = Math.random() * window.innerHeight;
            break;
        case 2: // Bottom
            x = Math.random() * window.innerWidth;
            y = window.innerHeight + size;
            break;
        case 3: // Left
            x = -size;
            y = Math.random() * window.innerHeight;
            break;
    }
    
    enemy.style.left = `${x}px`;
    enemy.style.top = `${y}px`;
    enemy.style.width = `${size}px`;
    enemy.style.height = `${size}px`;
    gameContainer.appendChild(enemy);
    enemies.push({ element: enemy, speed: speed, health: health, size: size });
}

function moveEnemies() {
    const playerRect = player.getBoundingClientRect();
    const playerX = playerRect.left + playerRect.width / 2;
    const playerY = playerRect.top + playerRect.height / 2;
    
    enemies.forEach((enemy, index) => {
        const enemyRect = enemy.element.getBoundingClientRect();
        const enemyX = enemyRect.left + enemyRect.width / 2;
        const enemyY = enemyRect.top + enemyRect.height / 2;
        
        const angle = Math.atan2(playerY - enemyY, playerX - enemyX);
        
        const newX = enemyX + Math.cos(angle) * enemy.speed;
        const newY = enemyY + Math.sin(angle) * enemy.speed;
        
        enemy.element.style.left = `${newX - enemy.size / 2}px`;
        enemy.element.style.top = `${newY - enemy.size / 2}px`;
        
        if (checkCollision(playerRect, enemyRect)) {
            health -= 10;
            updateHUD();
            createExplosion(enemyX, enemyY);
            gameContainer.removeChild(enemy.element);
            enemies.splice(index, 1);
            
            if (health <= 0) {
                gameOver();
            }
        }
    });
}

function checkCollision(rect1, rect2) {
    return rect1.left < rect2.right &&
           rect1.right > rect2.left &&
           rect1.top < rect2.bottom &&
           rect1.bottom > rect2.top;
}

function gameOver() {
    cancelAnimationFrame(gameLoop);
    clearTimeout(waveTimeout);
    gameOverScreen.classList.remove('hidden');
    finalScoreElement.textContent = score;
}

function createBullet(x, y, angle) {
    const bullet = document.createElement('div');
    bullet.classList.add('bullet');
    bullet.style.left = `${x}px`;
    bullet.style.top = `${y}px`;
    gameContainer.appendChild(bullet);
    
    const weapon = weapons[currentWeapon];
    bullets.push({ element: bullet, angle: angle, speed: weapon.bulletSpeed, damage: weapon.damage });
    
    shootSound.currentTime = 0;
    shootSound.play();
}

function moveBullets() {
    bullets.forEach((bullet, index) => {
        const newX = bullet.element.offsetLeft + Math.cos(bullet.angle) * bullet.speed;
        const newY = bullet.element.offsetTop + Math.sin(bullet.angle) * bullet.speed;
        
        bullet.element.style.left = `${newX}px`;
        bullet.element.style.top = `${newY}px`;
        
        if (newX < 0 || newX > window.innerWidth || newY < 0 || newY > window.innerHeight) {
            gameContainer.removeChild(bullet.element);
            bullets.splice(index, 1);
        }
        
        checkBulletCollisions(bullet);
    });
}

function checkBulletCollisions(bullet) {
    const bulletRect = bullet.element.getBoundingClientRect();
    
    enemies.forEach((enemy, index) => {
        const enemyRect = enemy.element.getBoundingClientRect();
        
        if (checkCollision(bulletRect, enemyRect)) {
            enemy.health -= bullet.damage;
            
            if (enemy.health <= 0) {
                createExplosion(enemyRect.left + enemyRect.width / 2, enemyRect.top + enemyRect.height / 2);
                gameContainer.removeChild(enemy.element);
                enemies.splice(index, 1);
                score += 10;
                updateHUD();
            }
            
            gameContainer.removeChild(bullet.element);
            bullets.splice(bullets.indexOf(bullet), 1);
            
            hitSound.currentTime = 0;
            hitSound.play();
        }
    });
}

function movePlayer() {
    const playerRect = player.getBoundingClientRect();
    let newX = playerRect.left;
    let newY = playerRect.top;

    if (keys.w && newY > 0) newY -= playerSpeed;
    if (keys.s && newY < window.innerHeight - playerRect.height) newY += playerSpeed;
    if (keys.a && newX > 0) newX -= playerSpeed;
    if (keys.d && newX < window.innerWidth - playerRect.width) newX += playerSpeed;

    player.style.left = `${newX}px`;
    player.style.top = `${newY}px`;
}

function createPowerUp() {
    const powerUp = document.createElement('div');
    powerUp.classList.add('power-up');
    
    const type = Math.random();
    let effect;
    
    if (type < 0.33) {
        powerUp.classList.add('power-up-health');
        effect = () => {
            health = Math.min(health + 20, 100);
            updateHUD();
        };
    } else if (type < 0.66) {
        powerUp.classList.add('power-up-speed');
        effect = () => {
            playerSpeed += 1;
            setTimeout(() => playerSpeed -= 1, 5000);
        };
    } else {
        powerUp.classList.add('power-up-damage');
        effect = () => {
            playerDamage += 1;
            setTimeout(() => playerDamage -= 1, 5000);
        };
    }
    
    powerUp.style.left = `${Math.random() * (window.innerWidth - 20)}px`;
    powerUp.style.top = `${Math.random() * (window.innerHeight - 20)}px`;
    gameContainer.appendChild(powerUp);
    powerUps.push({ element: powerUp, effect: effect });
}

function checkPowerUpCollisions() {
    const playerRect = player.getBoundingClientRect();
    
    powerUps.forEach((powerUp, index) => {
        const powerUpRect = powerUp.element.getBoundingClientRect();
        
        if (checkCollision(playerRect, powerUpRect)) {
            powerUp.effect();
            gameContainer.removeChild(powerUp.element);
            powerUps.splice(index, 1);
            
            powerupSound.currentTime = 0;
            powerupSound.play();
        }
    });
}

function createExplosion(x, y) {
    const explosion = document.createElement('div');
    explosion.classList.add('explosion');
    explosion.style.left = `${x - 25}px`;
    explosion.style.top = `${y - 25}px`;
    gameContainer.appendChild(explosion);
    
    explosionSound.currentTime = 0;
    explosionSound.play();
    
    setTimeout(() => {
        gameContainer.removeChild(explosion);
    }, 500);
    
    createParticles(x, y);
}

function createParticles(x, y) {
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        gameContainer.appendChild(particle);
        
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        const lifetime = Math.random() * 1000 + 500;
        
        particles.push({ element: particle, angle: angle, speed: speed, lifetime: lifetime });
    }
}

function moveParticles() {
    particles.forEach((particle, index) => {
        const newX = particle.element.offsetLeft + Math.cos(particle.angle) * particle.speed;
        const newY = particle.element.offsetTop + Math.sin(particle.angle) * particle.speed;
        
        particle.element.style.left = `${newX}px`;
        particle.element.style.top = `${newY}px`;
        
        particle.lifetime -= 16; // Assuming 60 FPS
        
        if (particle.lifetime <= 0) {
            gameContainer.removeChild(particle.element);
            particles.splice(index, 1);
        } else {
            particle.element.style.opacity = particle.lifetime / 1500;
        }
    });
}

function updateMiniMap() {
    miniMap.innerHTML = '';
    const scale = 150 / Math.max(window.innerWidth, window.innerHeight);
    
    const playerDot = document.createElement('div');
    playerDot.style.position = 'absolute';
    playerDot.style.width = '4px';
    playerDot.style.height = '4px';
    playerDot.style.backgroundColor = 'blue';
    playerDot.style.left = `${player.offsetLeft * scale}px`;
    playerDot.style.top = `${player.offsetTop * scale}px`;
    miniMap.appendChild(playerDot);
    
    enemies.forEach(enemy => {
        const enemyDot = document.createElement('div');
        enemyDot.style.position = 'absolute';
        enemyDot.style.width = '3px';
        enemyDot.style.height = '3px';
        enemyDot.style.backgroundColor = 'red';
        enemyDot.style.left = `${enemy.element.offsetLeft * scale}px`;
        enemyDot.style.top = `${enemy.element.offsetTop * scale}px`;
        miniMap.appendChild(enemyDot);
    });
}

function gameLoop() {
    movePlayer();
    moveEnemies();
    moveBullets();
    moveParticles();
    checkPowerUpCollisions();
    updateMiniMap();
    requestAnimationFrame(gameLoop);
}

function startWave() {
    wave++;
    updateHUD();
    
    for (let i = 0; i < wave * 5; i++) {
        setTimeout(createEnemy, i * 500);
    }
    
    waveTimeout = setTimeout(startWave, wave * 5 * 500 + 5000);
}

document.addEventListener('keydown', (e) => {
    if (e.key in keys) {
        keys[e.key] = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key in keys) {
        keys[e.key] = false;
    }
});


let lastShot = 0;
document.addEventListener('mousedown', (e) => {
    const shoot = () => {
        const playerRect = player.getBoundingClientRect();
        const playerX = playerRect.left + playerRect.width / 2;
        const playerY = playerRect.top + playerRect.height / 2;
        const angle = Math.atan2(e.clientY - playerY, e.clientX - playerX);
        
        if (currentWeapon === 'shotgun') {
            for (let i = 0; i < weapons.shotgun.bullets; i++) {
                const spreadAngle = angle + (Math.random() - 0.5) * weapons.shotgun.spread;
                createBullet(playerX, playerY, spreadAngle);
            }
        } else {
            createBullet(playerX, playerY, angle);
        }
        
        lastShot = Date.now();
    };

    if (Date.now() - lastShot > weapons[currentWeapon].fireRate) {
        shoot();
    }
});

let shootingInterval;
document.addEventListener('mousedown', () => {
    if (Date.now() - lastShot > weapons[currentWeapon].fireRate) {
        const shoot = () => {
            const playerRect = player.getBoundingClientRect();
            const playerX = playerRect.left + playerRect.width / 2;
            const playerY = playerRect.top + playerRect.height / 2;
            const angle = Math.atan2(e.clientY - playerY, e.clientX - playerX);
            
            if (currentWeapon === 'shotgun') {
                for (let i = 0; i < weapons.shotgun.bullets; i++) {
                    const spreadAngle = angle + (Math.random() - 0.5) * weapons.shotgun.spread;
                    createBullet(playerX, playerY, spreadAngle);
                }
            } else {
                createBullet(playerX, playerY, angle);
            }
            
            lastShot = Date.now();
        };

        shootingInterval = setInterval(shoot, weapons[currentWeapon].fireRate);
        shoot();
    }
});

document.addEventListener('mouseup', () => {
    clearInterval(shootingInterval);
});

restartButton.addEventListener('click', () => {
    score = 0;
    health = 100;
    wave = 1;
    enemies = [];
    bullets = [];
    powerUps = [];
    particles = [];
    playerSpeed = 5;
    playerDamage = 1;
    currentWeapon = 'pistol';
    updateHUD();
    gameOverScreen.classList.add('hidden');
    startWave();
    gameLoop = requestAnimationFrame(gameLoop);
});

closeUpgradeMenuButton.addEventListener('click', () => {
    upgradeMenu.classList.add('hidden');
});


updateHUD();
startWave();
gameLoop = requestAnimationFrame(gameLoop);