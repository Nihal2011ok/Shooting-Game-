const gameContainer = document.getElementById('game-container');
const player = document.getElementById('player');
const scoreElement = document.getElementById('score-value');

let score = 0;
let enemies = [];
let bullets = [];

function updateScore() {
    scoreElement.textContent = score;
}

function createEnemy() {
    const enemy = document.createElement('div');
    enemy.classList.add('enemy');
    
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    switch(side) {
        case 0: 
            x = Math.random() * window.innerWidth;
            y = -30;
            break;
        case 1: 
            x = window.innerWidth + 30;
            y = Math.random() * window.innerHeight;
            break;
        case 2: 
            x = Math.random() * window.innerWidth;
            y = window.innerHeight + 30;
            break;
        case 3: 
            x = -30;
            y = Math.random() * window.innerHeight;
            break;
    }
    
    enemy.style.left = `${x}px`;
    enemy.style.top = `${y}px`;
    gameContainer.appendChild(enemy);
    enemies.push(enemy);
}

function moveEnemies() {
    const playerRect = player.getBoundingClientRect();
    const playerX = playerRect.left + playerRect.width / 2;
    const playerY = playerRect.top + playerRect.height / 2;
    
    enemies.forEach((enemy, index) => {
        const enemyRect = enemy.getBoundingClientRect();
        const enemyX = enemyRect.left + enemyRect.width / 2;
        const enemyY = enemyRect.top + enemyRect.height / 2;
        
        const angle = Math.atan2(playerY - enemyY, playerX - enemyX);
        const speed = 2;
        
        const newX = enemyX + Math.cos(angle) * speed;
        const newY = enemyY + Math.sin(angle) * speed;
        
        enemy.style.left = `${newX - enemyRect.width / 2}px`;
        enemy.style.top = `${newY - enemyRect.height / 2}px`;
        
        if (checkCollision(playerRect, enemyRect)) {
            gameOver();
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
    alert(`Game Over! Your score: ${score}`);
    location.reload();
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
        const enemyRect = enemy.getBoundingClientRect();
        
        if (checkCollision(bulletRect, enemyRect)) {
            gameContainer.removeChild(enemy);
            enemies.splice(index, 1);
            gameContainer.removeChild(bullet.element);
            bullets.splice(bullets.indexOf(bullet), 1);
            score++;
            updateScore();
        }
    });
}

document.addEventListener('mousemove', (e) => {
    player.style.left = `${e.clientX - 20}px`;
    player.style.top = `${e.clientY - 20}px`;
});

document.addEventListener('click', (e) => {
    const playerRect = player.getBoundingClientRect();
    const playerX = playerRect.left + playerRect.width / 2;
    const playerY = playerRect.top + playerRect.height / 2;
    const angle = Math.atan2(e.clientY - playerY, e.clientX - playerX);
    createBullet(playerX, playerY, angle);
});

function gameLoop() {
    moveEnemies();
    moveBullets();
    requestAnimationFrame(gameLoop);
}

setInterval(createEnemy, 1000);
gameLoop();