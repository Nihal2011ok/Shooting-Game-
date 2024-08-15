const gameContainer = document.getElementById('game-container');
const player = document.getElementById('player');
const scoreElement = document.getElementById('score-value');
const healthElement = document.getElementById('health-value');
const gameOverScreen = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');

let score = 0;
let health = 100;
let enemies = [];
let bullets = [];
let powerUps = [];
let playerSpeed = 5;
let playerDamage = 1;
let gameLoop;

const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

function updateScore() {
    scoreElement.textContent = score;
}

function updateHealth() {
    healthElement.textContent = health;
}

function createEnemy() {
    const enemy = document.createElement('div');
    enemy.classList.add('enemy');
    
    const enemyType = Math.random();
    let speed, health;
    
    if (enemyType < 0.6) {
        enemy.classList.add('enemy-normal');
        speed = 2;
        health = 1;
    } else if (enemyType < 0.9) {
        enemy.classList.add('enemy-fast');
        speed = 3;
        health = 1;
    } else {
        enemy.classList.add('enemy-tank');
        speed = 1;
        health = 3;
    }
    
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    switch(side) {
        case 0: // Top
            x = Math.random() * window.innerWidth;
            y = -30;
            break;
        case 1: // Right
            x = window.innerWidth + 30;
            y = Math.random() * window.innerHeight;
            break;
        case 2: // Bottom
            x = Math.random() * window.innerWidth;
            y = window.innerHeight + 30;
            break;
        case 3: // Left
            x = -30;
            y = Math.random() * window.innerHeight;
            break;
    }
    
    enemy.style.left = `${x}px`;
    enemy.style.top = `${y}px`;
    gameContainer.appendChild(enemy);
    enemies.push({ element: enemy, speed: speed, health: health });
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
        
        enemy.element.style.left = `${newX - enemyRect.width / 2}px`;
        enemy.element.style.top = `${newY - enemyRect.height / 2}px`;
        
        if (checkCollision(playerRect, enemyRect)) {
            health -= 10;
            updateHealth();
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
    gameOverScreen.classList.remove('hidden');
    finalScoreElement.textContent = score;
}

function createBullet(x, y, angle) {
    const bullet = document.createElement('div');
    bullet.classList.add('bullet');
    bullet.style.left = `${x}px`;
    bullet.style.top = `${y}px`;
    gameContainer.appendChild(bullet);
    bullets.push({ element: bullet, angle: angle });
}

function moveBullets() {
    bullets.forEach((bullet, index) => {
        const speed = 10;
        const newX = bullet.element.offsetLeft + Math.cos(bullet.angle) * speed;
        const newY = bullet.element.offsetTop + Math.sin(bullet.angle) * speed;
        
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
            enemy.health -= playerDamage;
            
            if (enemy.health <= 0) {
                gameContainer.removeChild(enemy.element);
                enemies.splice(index, 1);
                score++;
                updateScore();
            }
            
            gameContainer.removeChild(bullet.element);
            bullets.splice(bullets.indexOf(bullet), 1);
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
            updateHealth();
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
        }
    });
}

function gameLoop() {
    movePlayer();
    moveEnemies();
    moveBullets();
    checkPowerUpCollisions();
    requestAnimationFrame(gameLoop);
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

document.addEventListener('mousemove', (e) => {
    const playerRect = player.getBoundingClientRect();
    const playerX = playerRect.left + playerRect.width / 2;
    const playerY = playerRect.top + playerRect.height / 2;
    const angle = Math.atan2(e.clientY - playerY, e.clientX - playerX);
    player.style.transform = `rotate(${angle}rad)`;
});

document.addEventListener('click', (e) => {
    const playerRect = player.getBoundingClientRect();
    const playerX = playerRect.left + playerRect.width / 2;
    const playerY = playerRect.top + playerRect.height / 2;
    const angle = Math.atan2(e.clientY - playerY, e.clientX - playerX);
    createBullet(playerX, playerY, angle);
});

restartButton.addEventListener('click', () => {
    location.reload();
});

function startGame() {
    player.style.left = `${window.innerWidth / 2 - 20}px`;
    player.style.top = `${window.innerHeight / 2 - 20}px`;
    updateScore();
    updateHealth();
    gameLoop = requestAnimationFrame(gameLoop);
    setInterval(createEnemy, 1000);
    setInterval(createPowerUp, 10000);
}

startGame();