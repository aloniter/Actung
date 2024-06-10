const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const score1Element = document.getElementById('score1');
const score2Element = document.getElementById('score2');

const scale = 10;
const tokenScale = 40; // New scale for the tokens
let baseSpeed = 8; // Base game speed in units per second
let lastTime = 0;
let accumulatedTime = 0;

const player1 = {
    x: 100,
    y: 100,
    xSpeed: scale, // Initial speed in x direction
    ySpeed: 0, // Initial speed in y direction
    color: 'red',
    trail: [],
    score: 0,
    effects: {},
    size: 1,
    speedMultiplier: 1 // Speed multiplier for individual player
};

const player2 = {
    x: 300,
    y: 300,
    xSpeed: -scale, // Initial speed in x direction
    ySpeed: 0, // Initial speed in y direction
    color: 'blue',
    trail: [],
    score: 0,
    effects: {},
    size: 1,
    speedMultiplier: 1 // Speed multiplier for individual player
};

const tokens = [
    { type: 'fast', img: new Image(), effect: applyFastEffect },
    { type: 'big', img: new Image(), effect: applyBigEffect },
    { type: 'slow', img: new Image(), effect: applySlowEffect }
];

tokens[0].img.src = 'path_to_fast_icon.png';
tokens[1].img.src = 'path_to_big_icon.png';
tokens[2].img.src = 'path_to_slow_icon.png';

let gameActive = true;

function setupCanvas() {
    canvas.width = window.innerWidth - (window.innerWidth % scale);
    canvas.height = window.innerHeight - (window.innerHeight % scale);
}

function setup() {
    setupCanvas();
    createTokens();
    window.requestAnimationFrame(gameLoop);
}

function gameLoop(currentTime) {
    if (!gameActive) return;

    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;
    accumulatedTime += deltaTime;

    if (accumulatedTime > 1 / (baseSpeed * Math.max(player1.speedMultiplier, player2.speedMultiplier))) {
        accumulatedTime -= 1 / (baseSpeed * Math.max(player1.speedMultiplier, player2.speedMultiplier));
        update();
        draw();
    }

    window.requestAnimationFrame(gameLoop);
}

function update() {
    movePlayer(player1);
    movePlayer(player2);
    checkCollisions();
    checkTokenCollisions(player1, player2);
    checkTokenCollisions(player2, player1);
    updateEffects(player1);
    updateEffects(player2);
}

function movePlayer(player) {
    player.trail.push({ x: player.x, y: player.y, size: player.size });

    player.x += player.xSpeed * player.speedMultiplier;
    player.y += player.ySpeed * player.speedMultiplier;

    if (player.x >= canvas.width) player.x = 0;
    if (player.y >= canvas.height) player.y = 0;
    if (player.x < 0) player.x = canvas.width - scale;
    if (player.y < 0) player.y = canvas.height - scale;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawPlayerTrail(player1);
    drawPlayerTrail(player2);
    drawTokens();
    drawCredits();
}

function drawPlayerTrail(player) {
    ctx.fillStyle = player.color;

    for (let i = 0; i < player.trail.length; i++) {
        ctx.fillRect(player.trail[i].x, player.trail[i].y, scale * player.trail[i].size, scale * player.trail[i].size);
    }

    ctx.fillRect(player.x, player.y, scale * player.size, scale * player.size);
}

function createTokens() {
    tokens.forEach(token => {
        token.x = Math.floor(Math.random() * (canvas.width / scale)) * scale;
        token.y = Math.floor(Math.random() * (canvas.height / scale)) * scale;
    });
}

function drawTokens() {
    tokens.forEach(token => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(token.x + tokenScale / 2, token.y + tokenScale / 2, tokenScale / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(token.img, token.x, token.y, tokenScale, tokenScale);
        ctx.restore();
    });
}

function drawCredits() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Created by: Alon Iter', canvas.width / 2, canvas.height - 20);
}

function checkTokenCollisions(player, opponent) {
    tokens.forEach(token => {
        if (player.x >= token.x && player.x < token.x + tokenScale &&
            player.y >= token.y && player.y < token.y + tokenScale) {
            token.effect(player, opponent);
            token.x = Math.floor(Math.random() * (canvas.width / scale)) * scale;
            token.y = Math.floor(Math.random() * (canvas.height / scale)) * scale;
        }
    });
}

function applyFastEffect(player) {
    player.effects.fast = Date.now() + 5000; // 5 seconds from now
    player.speedMultiplier *= 2; // Double the player's speed
}

function applyBigEffect(player) {
    player.effects.big = Date.now() + 5000; // 5 seconds from now
    player.size = 3; // Make the player three times bigger
}

function applySlowEffect(player, opponent) {
    opponent.effects.slow = Date.now() + 5000; // 5 seconds from now
    opponent.speedMultiplier /= 2; // Halve the opponent's speed
}

function updateEffects(player) {
    const currentTime = Date.now();

    if (player.effects.fast && currentTime > player.effects.fast) {
        player.speedMultiplier /= 2; // Revert to original speed
        delete player.effects.fast;
    }

    if (player.effects.big && currentTime > player.effects.big) {
        player.size = 1; // Revert to original size
        delete player.effects.big;
    }

    if (player.effects.slow && currentTime > player.effects.slow) {
        player.speedMultiplier *= 2; // Revert to original speed
        delete player.effects.slow;
    }
}

function checkCollisions() {
    checkPlayerCollision(player1, player2);
    checkPlayerCollision(player2, player1);

    checkSelfCollision(player1);
    checkSelfCollision(player2);
}

function checkPlayerCollision(player, opponent) {
    for (let i = 0; i < opponent.trail.length; i++) {
        if (player.x === opponent.trail[i].x && player.y === opponent.trail[i].y) {
            endRound(opponent);
        }
    }
}

function checkSelfCollision(player) {
    for (let i = 0; i < player.trail.length; i++) {
        if (player.x === player.trail[i].x && player.y === player.trail[i].y) {
            endRound(player === player1 ? player2 : player1);
        }
    }
}

function endRound(winner) {
    gameActive = false;
    winner.score++;
    updateScore();
    if (winner.score >= 5) {
        alert(`${winner.color} player wins the game!`);
        resetGame();
    } else {
        resetRound();
    }
}

function updateScore() {
    score1Element.innerText = player1.score;
    score2Element.innerText = player2.score;
}

function resetRound() {
    player1.x = 100;
    player1.y = 100;
    player1.xSpeed = scale;
    player1.ySpeed = 0;
    player1.trail = [];
    player1.size = 1;
    player1.effects = {};
    player1.speedMultiplier = 1;

    player2.x = 300;
    player2.y = 300;
    player2.xSpeed = -scale;
    player2.ySpeed = 0;
    player2.trail = [];
    player2.size = 1;
    player2.effects = {};
    player2.speedMultiplier = 1;

    gameActive = true;
    window.requestAnimationFrame(gameLoop);
}

function resetGame() {
    player1.score = 0;
    player2.score = 0;
    updateScore();
    resetRound();
}

window.addEventListener('keydown', e => {
    switch (e.key) {
        case 'ArrowUp':
            if (player1.ySpeed === 0) {
                player1.xSpeed = 0;
                player1.ySpeed = -scale;
            }
            break;
        case 'ArrowDown':
            if (player1.ySpeed === 0) {
                player1.xSpeed = 0;
                player1.ySpeed = scale;
            }
            break;
        case 'ArrowLeft':
            if (player1.xSpeed === 0) {
                player1.xSpeed = -scale;
                player1.ySpeed = 0;
            }
            break;
        case 'ArrowRight':
            if (player1.xSpeed === 0) {
                player1.xSpeed = scale;
                player1.ySpeed = 0;
            }
            break;
        case 'w':
            if (player2.ySpeed === 0) {
                player2.xSpeed = 0;
                player2.ySpeed = -scale;
            }
            break;
        case 's':
            if (player2.ySpeed === 0) {
                player2.xSpeed = 0;
                player2.ySpeed = scale;
            }
            break;
        case 'a':
            if (player2.xSpeed === 0) {
                player2.xSpeed = -scale;
                player2.ySpeed = 0;
            }
            break;
        case 'd':
            if (player2.xSpeed === 0) {
                player2.xSpeed = scale;
                player2.ySpeed = 0;
            }
            break;
    }
});

setup();
