const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gridSize = 30;
let score = 0;
let gameSpeed = 8; // frames between moves
let enemySpeed = 12; // enemies move slower than player
let frameCount = 0;
let powerPelletActive = false;
let powerPelletTimer = 0;
let gameState = 'playing'; // 'playing', 'gameOver', 'victory', 'paused'
let enemyTrails = []; // for fire effect

// UI System Variables
let playerHealth = 3;
let maxHealth = 3;
let totalDroplets = 0;
let dropletsCollected = 0;
let audioEnabled = true;
let gameInitialized = false;

// Game assets
const playerImgs = {
    closed: new Image(),
    halfOpen: new Image(),
    fullOpen: new Image()
};
playerImgs.closed.src = 'assets/Veli_asset_MAN_closed.svg';
playerImgs.halfOpen.src = 'assets/Veli_asset_MAN_Half_open.svg';
playerImgs.fullOpen.src = 'assets/Veli_asset_MAN_Full_open.svg';

// Fallback to original if new assets don't load
const originalPlayerImg = new Image();
originalPlayerImg.src = 'assets/Main Veli man character.svg';

// Enemy sun images with directional animations
const enemyImgs = {
    leftUp: new Image(),
    leftDown: new Image(),
    rightUp: new Image(),
    rightDown: new Image(),
    openMouth: new Image(),
    default: new Image() // Fallback
};

enemyImgs.leftUp.src = 'assets/Veli_asset_SUN_left_up.svg';
enemyImgs.leftDown.src = 'assets/Veli_asset_SUN_left_down.svg';
enemyImgs.rightUp.src = 'assets/Veli_asset_SUN_Right_up.svg';
enemyImgs.rightDown.src = 'assets/Veli_asset_SUN_Right_down.svg';
enemyImgs.openMouth.src = 'assets/Veli_asset_SUN_open_mouth.svg';
enemyImgs.default.src = 'assets/enemy sun.svg'; // Original fallback

const dropletImg = new Image();
dropletImg.src = 'assets/droplet.svg';

const debuffImg = new Image();
debuffImg.src = 'assets/debuff.svg';

// Animation cycle for player
let playerAnimFrame = 0;
const animationSpeed = 8; // frames between animation changes

// Enemy animation states
let enemyMouthAnimTimer = 0;
const enemyMouthAnimSpeed = 45; // frames between mouth animations

// Enhanced maze with better strategic gameplay
const maze = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1],
    [1,1,1,0,1,1,1,1,0,1,1,0,1,1,1,1,0,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,1,0,0,1,1,0,1,0,1,1,0,1],
    [1,0,0,1,0,1,0,0,0,0,0,0,0,0,1,0,1,0,0,1],
    [0,0,0,1,0,0,0,1,1,2,2,1,1,0,0,0,1,0,0,0],
    [1,1,0,1,1,1,0,1,0,2,2,0,1,0,1,1,1,0,1,1],
    [0,0,0,1,0,0,0,1,1,2,2,1,1,0,0,0,1,0,0,0],
    [1,0,0,1,0,1,0,0,0,0,0,0,0,0,1,0,1,0,0,1],
    [1,0,1,1,0,1,0,1,1,0,0,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,0,1,1,1,1,0,1,1,0,1,1,1,1,0,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Game objects
let player = { x: 1, y: 3, dx: 0, dy: 0 };
let enemies = [
    { x: 9, y: 9, dx: 1, dy: 0 },
    { x: 10, y: 9, dx: -1, dy: 0 },
    { x: 9, y: 8, dx: 0, dy: 1 },
    { x: 10, y: 10, dx: 0, dy: -1 }
];
let droplets = [];
let debuffs = [];
let debuffPositions = []; // Track debuff positions to avoid droplet spawns

// UI System Functions
function updateBottle() {
    const percentage = totalDroplets > 0 ? Math.round((dropletsCollected / totalDroplets) * 100) : 0;
    const waterHeight = Math.min(85, (dropletsCollected / totalDroplets) * 85); // Max 85% of bottle height
    
    const bottleWater = document.getElementById('bottle-water');
    const waterPercentage = document.getElementById('water-percentage');
    
    if (bottleWater && waterPercentage) {
        bottleWater.style.height = `${waterHeight}%`;
        waterPercentage.textContent = `${percentage}%`;
    }
}

function updateHealth() {
    // Update right side health display
    const hearts = ['heart1', 'heart2', 'heart3'];
    
    hearts.forEach((heartId, index) => {
        const heart = document.getElementById(heartId);
        if (heart) {
            const img = heart.querySelector('img');
            if (index < playerHealth) {
                img.src = 'assets/full heart.svg';
                heart.style.opacity = '1';
            } else {
                img.src = 'assets/empty heart.svg';
                heart.style.opacity = '0.5';
            }
        }
    });
    
    // Update bottom status bar hearts
    const statusHearts = document.querySelectorAll('.status-heart');
    statusHearts.forEach((heart, index) => {
        if (index < playerHealth) {
            heart.src = 'assets/full heart.svg';
            heart.style.opacity = '1';
        } else {
            heart.src = 'assets/empty heart.svg';
            heart.style.opacity = '0.5';
        }
    });
}

function updateScore() {
    const scoreElement = document.getElementById('score-value');
    if (scoreElement) {
        scoreElement.textContent = score;
    }
}

function createWaterParticle(x, y) {
    const particle = document.createElement('div');
    particle.className = 'water-particle';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    document.body.appendChild(particle);
    
    setTimeout(() => {
        if (particle && particle.parentNode) {
            particle.parentNode.removeChild(particle);
        }
    }, 1200);
}

function createDebuffParticle(x, y) {
    const particle = document.createElement('div');
    particle.className = 'debuff-particle';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    document.body.appendChild(particle);
    
    setTimeout(() => {
        if (particle && particle.parentNode) {
            particle.parentNode.removeChild(particle);
        }
    }, 1000);
}

function damagePlayer() {
    if (powerPelletActive) return; // Invulnerable during power pellet
    
    playerHealth--;
    updateHealth();
    
    // Add damage animation to hearts
    const heartElement = document.getElementById(`heart${playerHealth + 1}`);
    if (heartElement) {
        heartElement.classList.add('damaged');
        setTimeout(() => {
            heartElement.classList.remove('damaged');
        }, 600);
    }
    
    if (playerHealth <= 0) {
        gameState = 'gameOver';
    }
}

function applyDebuff() {
    // Remove water from bottle (lose 20% of collected water)
    const waterLoss = Math.ceil(dropletsCollected * 0.2);
    dropletsCollected = Math.max(0, dropletsCollected - waterLoss);
    
    // Slow down player temporarily
    gameSpeed = Math.min(16, gameSpeed + 4); // Make player slower
    
    // Update UI
    updateBottle();
    
    // Reset speed after 3 seconds
    setTimeout(() => {
        gameSpeed = Math.max(8, gameSpeed - 4);
    }, 3000);
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
    } else if (gameState === 'paused') {
        gameState = 'playing';
    }
}

function toggleAudio() {
    audioEnabled = !audioEnabled;
    const audioBtn = document.getElementById('audio-btn');
    if (audioBtn) {
        const img = audioBtn.querySelector('img');
        if (audioEnabled) {
            img.src = 'assets/Audio off.svg'; // This actually represents audio ON in our case
            img.style.opacity = '1';
        } else {
            img.src = 'assets/Audio off.svg'; // Keep same icon for now
            img.style.opacity = '0.5';
        }
    }
}

function isValidPosition(x, y) {
    return y >= 0 && y < maze.length && x >= 0 && x < maze[0].length && 
           maze[y][x] !== 1;
}

function getValidDirections(x, y) {
    const directions = [
        { dx: 0, dy: 1 },  // down
        { dx: 0, dy: -1 }, // up
        { dx: 1, dy: 0 },  // right
        { dx: -1, dy: 0 }  // left
    ];
    
    return directions.filter(dir => {
        let testX = x + dir.dx;
        let testY = y + dir.dy;
        
        // Handle tunnel wraparound
        if (testX < 0) testX = maze[0].length - 1;
        if (testX >= maze[0].length) testX = 0;
        
        return isValidPosition(testX, testY);
    });
}

function setup() {
    console.log('Setup function called');
    
    if (!canvas) {
        console.error('Canvas not found!');
        return;
    }
    
    const baseWidth = maze[0].length * gridSize;
    const baseHeight = maze.length * gridSize;
    const scale = 4; // Render at 4x resolution for crisp graphics

    canvas.width = baseWidth * scale;
    canvas.height = baseHeight * scale;

    canvas.style.width = `${baseWidth}px`;
    canvas.style.height = `${baseHeight}px`;

    ctx.scale(scale, scale);
    
    console.log(`Canvas size: ${baseWidth}x${baseHeight}, scaled to ${canvas.width}x${canvas.height}`);

    // Add debuffs first and track their positions
    debuffPositions = [
        { x: 18, y: 1 },
        { x: 1, y: 18 },
        { x: 18, y: 18 },
        { x: 1, y: 1 }
    ];
    
    debuffs = debuffPositions.map(pos => ({ x: pos.x, y: pos.y, type: 'debuff' }));

    // Initialize droplets and count total (avoid debuff positions)
    totalDroplets = 0;
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            if (maze[y][x] === 0) {
                // Check if this position conflicts with any debuff
                const conflictsWithDebuff = debuffPositions.some(pos => pos.x === x && pos.y === y);
                if (!conflictsWithDebuff) {
                    droplets.push({ x, y });
                    totalDroplets++;
                }
            }
        }
    }

    // Initialize UI
    updateHealth();
    updateBottle();
    updateScore();
    
    // Set initial score in bottom status bar
    const statusScoreElement = document.getElementById('score-value');
    if (statusScoreElement) {
        statusScoreElement.textContent = score;
    }

    // Add event listeners for keyboard
    window.addEventListener('keydown', handleKeyPress);
    
    // Add mobile controls with both click and touch events for better responsiveness
    const upBtn = document.getElementById('up');
    const leftBtn = document.getElementById('left');
    const rightBtn = document.getElementById('right');
    const downBtn = document.getElementById('down');
    
    function addTouchControls(btn, dx, dy) {
        if (btn) {
            btn.addEventListener('click', () => movePlayer(dx, dy));
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                movePlayer(dx, dy);
            });
        }
    }
    
    addTouchControls(upBtn, 0, -1);
    addTouchControls(leftBtn, -1, 0);
    addTouchControls(rightBtn, 1, 0);
    addTouchControls(downBtn, 0, 1);
    
    // Add UI button listeners with touch support
    const pauseBtn = document.getElementById('pause-btn');
    const audioBtn = document.getElementById('audio-btn');
    const backBtn = document.getElementById('back-btn');
    
    function addUIButtonListeners(btn, callback) {
        if (btn) {
            btn.addEventListener('click', callback);
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                callback();
            });
        }
    }
    
    addUIButtonListeners(pauseBtn, togglePause);
    addUIButtonListeners(audioBtn, toggleAudio);
    addUIButtonListeners(backBtn, () => {
        // Could implement menu navigation here
        console.log('Back button clicked');
    });
    
    gameInitialized = true;
    console.log('Starting game loop...');
    gameLoop();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fix SVG pixelation artifacts by ensuring pixel-perfect rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Ensure no glow effects are applied to any game elements
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw enemy fire trails first
    enemyTrails.forEach(trail => {
        const alpha = trail.life / trail.maxLife;
        
        if (trail.type === 'fire_particle') {
            // Special rendering for fire particles around enemies
            const size = Math.round(gridSize * 0.2 * alpha);
            const offset = Math.round((gridSize - size) / 2);
            
            ctx.save();
            ctx.globalAlpha = alpha * 0.9;
            
            // Create intense fire particle gradient
            const gradient = ctx.createRadialGradient(
                trail.x * gridSize + gridSize/2, trail.y * gridSize + gridSize/2, 0,
                trail.x * gridSize + gridSize/2, trail.y * gridSize + gridSize/2, size
            );
            gradient.addColorStop(0, '#ffff44');
            gradient.addColorStop(0.3, '#ff6600');
            gradient.addColorStop(0.6, '#ff2200');
            gradient.addColorStop(1, '#cc0000');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(
                Math.round(trail.x * gridSize + offset),
                Math.round(trail.y * gridSize + offset),
                size,
                size
            );
            ctx.restore();
        } else if (trail.type === 'explosion') {
            // Rendering for explosion effect
            const size = Math.round(gridSize * 0.3 * alpha);
            const offset = Math.round((gridSize - size) / 2);
            
            ctx.save();
            ctx.globalAlpha = alpha * 0.8;
            
            // Create a radial gradient for the explosion effect
            const gradient = ctx.createRadialGradient(
                trail.x * gridSize + gridSize/2, trail.y * gridSize + gridSize/2, 0,
                trail.x * gridSize + gridSize/2, trail.y * gridSize + gridSize/2, size
            );
            gradient.addColorStop(0, '#ff0000');
            gradient.addColorStop(0.5, '#ff4400');
            gradient.addColorStop(1, '#ff8800');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(
                Math.round(trail.x * gridSize + offset),
                Math.round(trail.y * gridSize + offset),
                size,
                size
            );
            ctx.restore();
        } else {
            // Regular movement trail rendering with enhanced fire effects
            const size = Math.round(gridSize * 0.35 * alpha);
            const offset = Math.round((gridSize - size) / 2);
            
            ctx.save();
            ctx.globalAlpha = alpha * 0.8;
            
            // Create enhanced fire gradient for movement trails
            const gradient = ctx.createRadialGradient(
                trail.x * gridSize + gridSize/2, trail.y * gridSize + gridSize/2, 0,
                trail.x * gridSize + gridSize/2, trail.y * gridSize + gridSize/2, size/2
            );
            gradient.addColorStop(0, '#ff6644');
            gradient.addColorStop(0.4, '#ff4400');
            gradient.addColorStop(0.7, '#ff8800');
            gradient.addColorStop(1, '#ffaa00');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(
                Math.round(trail.x * gridSize + offset),
                Math.round(trail.y * gridSize + offset),
                size,
                size
            );
            ctx.restore();
        }
    });
    
    // Draw maze walls as simple solid lines without any effects
    ctx.strokeStyle = '#b4d984';
    ctx.lineWidth = 3;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
    
    // Ensure absolutely no glow, shadow, or smoothing effects
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            if (maze[y][x] === 1) {
                const centerX = x * gridSize + gridSize / 2;
                const centerY = y * gridSize + gridSize / 2;
                
                // Check adjacent walls to draw connected lines
                const hasTop = y > 0 && maze[y - 1][x] === 1;
                const hasBottom = y < maze.length - 1 && maze[y + 1][x] === 1;
                const hasLeft = x > 0 && maze[y][x - 1] === 1;
                const hasRight = x < maze[y].length - 1 && maze[y][x + 1] === 1;
                
                ctx.beginPath();
                
                // Draw lines to connected walls
                if (hasTop) {
                    ctx.moveTo(centerX, centerY);
                    ctx.lineTo(centerX, centerY - gridSize / 2);
                }
                if (hasBottom) {
                    ctx.moveTo(centerX, centerY);
                    ctx.lineTo(centerX, centerY + gridSize / 2);
                }
                if (hasLeft) {
                    ctx.moveTo(centerX, centerY);
                    ctx.lineTo(centerX - gridSize / 2, centerY);
                }
                if (hasRight) {
                    ctx.moveTo(centerX, centerY);
                    ctx.lineTo(centerX + gridSize / 2, centerY);
                }
                
                // If isolated wall, draw a small circle
                if (!hasTop && !hasBottom && !hasLeft && !hasRight) {
                    ctx.moveTo(centerX, centerY);
                    ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
                }
                
                ctx.stroke();
            }
        }
    }

    // Draw droplets (bigger) with pixel-perfect positioning
    const dropletSize = Math.round(gridSize * 0.6);
    const dropletOffset = Math.round((gridSize - dropletSize) / 2);
    droplets.forEach(d => {
        ctx.drawImage(dropletImg, 
            Math.round(d.x * gridSize + dropletOffset), 
            Math.round(d.y * gridSize + dropletOffset), 
            dropletSize, 
            dropletSize
        );
    });

    // Draw debuffs (red pills) with pixel-perfect positioning
    const debuffSize = Math.round(gridSize * 0.7);
    const debuffOffset = Math.round((gridSize - debuffSize) / 2);
    debuffs.forEach(d => {
        // Add pulsing effect for debuffs
        ctx.save();
        const pulse = 1 + Math.sin(frameCount * 0.1) * 0.1;
        ctx.globalAlpha = 0.8 + Math.sin(frameCount * 0.15) * 0.2;
        
        ctx.drawImage(debuffImg, 
            Math.round(d.x * gridSize + debuffOffset), 
            Math.round(d.y * gridSize + debuffOffset), 
            debuffSize * pulse, 
            debuffSize * pulse
        );
        ctx.restore();
    });

    // Draw enemies with pixel-perfect positioning and directional animation
    enemies.forEach((e, index) => {
        ctx.save();
        
        // Make enemies bigger and add fiery effects
        const enemySize = Math.round(gridSize * 1.4); // Bigger than before
        const enemyOffset = Math.round((gridSize - enemySize) / 2);
        
        // Add pulsing fire effect (no glow, no transparency)
        const pulsePhase = (frameCount + index * 20) * 0.1;
        const pulseFactor = 1 + Math.sin(pulsePhase) * 0.15;
        
        // Draw main enemy (fully opaque)
        ctx.globalAlpha = 1.0; // Fully opaque
        
        const mainSize = enemySize * pulseFactor;
        const mainOffset = Math.round((gridSize - mainSize) / 2);
        
        // Flash enemies when power pellet is active
        if (powerPelletActive) {
            const flashRate = powerPelletTimer < 60 ? 8 : 15;
            if (Math.floor(frameCount / flashRate) % 2 === 0) {
                ctx.globalAlpha = 0.6; // Only reduce opacity when flashing
                ctx.filter = 'hue-rotate(180deg) brightness(0.6)';
            }
        }
        
        // Select the correct enemy sprite based on movement direction and animation
        let currentEnemyImg = enemyImgs.default; // Default fallback
        
        // Check if we should show open mouth (periodic animation)
        const shouldShowOpenMouth = Math.floor((frameCount + index * 15) / enemyMouthAnimSpeed) % 3 === 0;
        
        if (shouldShowOpenMouth && enemyImgs.openMouth.complete) {
            currentEnemyImg = enemyImgs.openMouth;
        } else {
            // Choose direction based on movement
            if (e.dx === -1 && e.dy === 0) { // Moving left
                currentEnemyImg = enemyImgs.leftDown.complete ? enemyImgs.leftDown : enemyImgs.default;
            } else if (e.dx === 1 && e.dy === 0) { // Moving right
                currentEnemyImg = enemyImgs.rightDown.complete ? enemyImgs.rightDown : enemyImgs.default;
            } else if (e.dx === 0 && e.dy === -1) { // Moving up
                currentEnemyImg = enemyImgs.rightUp.complete ? enemyImgs.rightUp : enemyImgs.default;
            } else if (e.dx === 0 && e.dy === 1) { // Moving down
                currentEnemyImg = enemyImgs.leftDown.complete ? enemyImgs.leftDown : enemyImgs.default;
            }
        }
        
        ctx.drawImage(currentEnemyImg, 
            Math.round(e.x * gridSize + mainOffset), 
            Math.round(e.y * gridSize + mainOffset), 
            mainSize, 
            mainSize
        );
        
        // Reset filter for fire particles
        ctx.filter = 'none';
        ctx.globalAlpha = 1.0;
        
        // Add fire particles around enemies
        if (frameCount % 8 === (index * 2) % 8) {
            const particleCount = 2;
            for (let i = 0; i < particleCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = enemySize * 0.6;
                const particleX = e.x * gridSize + gridSize/2 + Math.cos(angle) * distance;
                const particleY = e.y * gridSize + gridSize/2 + Math.sin(angle) * distance;
                
                enemyTrails.push({
                    x: particleX / gridSize,
                    y: particleY / gridSize,
                    life: 15,
                    maxLife: 15,
                    type: 'fire_particle'
                });
            }
        }
        
        ctx.restore();
    });

        // Draw player (bigger) with pixel-perfect positioning and animation
    const playerSize = Math.round(gridSize * 1.2);
    const playerOffset = Math.round((gridSize - playerSize) / 2);
    
    // Select the correct animation frame
    let currentPlayerImg = originalPlayerImg; // Default fallback
    
    // Use animation frames if available
    if (playerImgs.closed.complete) {
        switch(playerAnimFrame) {
            case 0: currentPlayerImg = playerImgs.closed; break;
            case 1: currentPlayerImg = playerImgs.halfOpen.complete ? playerImgs.halfOpen : playerImgs.closed; break;
            case 2: currentPlayerImg = playerImgs.fullOpen.complete ? playerImgs.fullOpen : playerImgs.closed; break;
            default: currentPlayerImg = playerImgs.closed;
        }
    }
    
    // Draw the player with directional facing
    if (currentPlayerImg && currentPlayerImg.complete) {
        ctx.save();
        
        // Calculate player center for transformations
        const playerCenterX = Math.round(player.x * gridSize + gridSize/2);
        const playerCenterY = Math.round(player.y * gridSize + gridSize/2);
        
        // Apply transformations based on movement direction
        ctx.translate(playerCenterX, playerCenterY);
        
        if (player.dx === -1) { // Moving left
            ctx.scale(-1, 1); // Flip horizontally
        } else if (player.dy === -1) { // Moving up
            ctx.rotate(-Math.PI / 2); // Rotate 90 degrees counter-clockwise
        } else if (player.dy === 1) { // Moving down
            ctx.rotate(Math.PI / 2); // Rotate 90 degrees clockwise
        }
        // For moving right (dx === 1) or stationary, no transformation needed
        
        ctx.drawImage(currentPlayerImg, 
            -playerSize/2, 
            -playerSize/2, 
            playerSize, 
            playerSize
        );
        
        ctx.restore();
    } else {
        // Fallback - draw a simple green circle
        ctx.fillStyle = '#b4d984';
        ctx.beginPath();
        ctx.arc(
            Math.round(player.x * gridSize + gridSize/2), 
            Math.round(player.y * gridSize + gridSize/2), 
            playerSize/2, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
    }
    
    // Draw power pellet status
    if (powerPelletActive) {
        ctx.fillStyle = '#ffff00';
        ctx.font = '14px Arial';
        ctx.fillText(`POWER: ${Math.ceil(powerPelletTimer / 60)}s`, 10, 40);
    }
    
    // Draw pause overlay
    if (gameState === 'paused') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width / ctx.getTransform().a, canvas.height / ctx.getTransform().d);
        
        ctx.fillStyle = '#b4d984';
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', (canvas.width / ctx.getTransform().a) / 2, (canvas.height / ctx.getTransform().d) / 2);
        ctx.textAlign = 'left';
    }
    
    // Draw game over or victory screen
    if (gameState === 'gameOver') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width / ctx.getTransform().a, canvas.height / ctx.getTransform().d);
        
        ctx.fillStyle = '#ff0000';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', (canvas.width / ctx.getTransform().a) / 2, (canvas.height / ctx.getTransform().d) / 2);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.fillText(`Final Score: ${score}`, (canvas.width / ctx.getTransform().a) / 2, (canvas.height / ctx.getTransform().d) / 2 + 40);
        ctx.fillText('Press R to restart', (canvas.width / ctx.getTransform().a) / 2, (canvas.height / ctx.getTransform().d) / 2 + 70);
        ctx.textAlign = 'left';
    }
    
    if (gameState === 'victory') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width / ctx.getTransform().a, canvas.height / ctx.getTransform().d);
        
        ctx.fillStyle = '#00ff00';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('VICTORY!', (canvas.width / ctx.getTransform().a) / 2, (canvas.height / ctx.getTransform().d) / 2);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.fillText(`Final Score: ${score}`, (canvas.width / ctx.getTransform().a) / 2, (canvas.height / ctx.getTransform().d) / 2 + 40);
        ctx.fillText('Press R to restart', (canvas.width / ctx.getTransform().a) / 2, (canvas.height / ctx.getTransform().d) / 2 + 70);
        ctx.textAlign = 'left';
    }
}

function update() {
    if (gameState !== 'playing') return;
    
    frameCount++;
    
    // Move player every few frames for smoother control
    if (frameCount % Math.max(1, gameSpeed - 4) === 0) {
        let newX = player.x + player.dx;
        let newY = player.y + player.dy;
        
        // Handle tunnel wraparound
        if (newX < 0) newX = maze[0].length - 1;
        if (newX >= maze[0].length) newX = 0;
        
        if (maze[newY] && maze[newY][newX] !== 1) {
            player.x = newX;
            player.y = newY;
        }
    }

    // Move enemies with improved AI (slower than player)
    if (frameCount % enemySpeed === 0) {
        enemies.forEach(enemy => {
            // Get current valid directions
            let validDirections = getValidDirections(enemy.x, enemy.y);
            
            // If enemy is stuck or has no valid directions, force a direction change
            if (validDirections.length === 0) {
                console.log(`Enemy stuck at ${enemy.x}, ${enemy.y}, trying to unstick...`);
                // Try all directions regardless of current logic
                const allDirections = [
                    { dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }
                ];
                validDirections = allDirections.filter(dir => {
                    let testX = enemy.x + dir.dx;
                    let testY = enemy.y + dir.dy;
                    if (testX < 0) testX = maze[0].length - 1;
                    if (testX >= maze[0].length) testX = 0;
                    return testY >= 0 && testY < maze.length && maze[testY][testX] === 0;
                });
            }
            
            // Check if enemy needs to change direction (hit wall or random change)
            let newEnemyX = enemy.x + enemy.dx;
            let newEnemyY = enemy.y + enemy.dy;
            
            // Handle tunnel wraparound for enemies
            if (newEnemyX < 0) newEnemyX = maze[0].length - 1;
            if (newEnemyX >= maze[0].length) newEnemyX = 0;
            
            // Check if enemy can continue in current direction or should change
            const shouldChangeDirection = !isValidPosition(newEnemyX, newEnemyY) || 
                                        (validDirections.length > 1 && Math.random() < 0.05); // 5% chance to randomly change direction
            
            if (shouldChangeDirection && validDirections.length > 0) {
                // Filter out the reverse direction to prevent immediate backtracking
                const nonReverseDirections = validDirections.filter(dir => 
                    !(dir.dx === -enemy.dx && dir.dy === -enemy.dy)
                );
                
                const directionsToUse = nonReverseDirections.length > 0 ? nonReverseDirections : validDirections;
                
                // 30% chance to move toward player if not in power pellet mode
                if (!powerPelletActive && Math.random() < 0.3 && directionsToUse.length > 1) {
                    const playerDir = {
                        dx: Math.sign(player.x - enemy.x),
                        dy: Math.sign(player.y - enemy.y)
                    };
                    const smartDir = directionsToUse.find(dir => 
                        dir.dx === playerDir.dx || dir.dy === playerDir.dy
                    );
                    if (smartDir) {
                        enemy.dx = smartDir.dx;
                        enemy.dy = smartDir.dy;
                    } else {
                        const randomDir = directionsToUse[Math.floor(Math.random() * directionsToUse.length)];
                        enemy.dx = randomDir.dx;
                        enemy.dy = randomDir.dy;
                    }
                } else {
                    const randomDir = directionsToUse[Math.floor(Math.random() * directionsToUse.length)];
                    enemy.dx = randomDir.dx;
                    enemy.dy = randomDir.dy;
                }
            }
            
            // Apply movement with the current or newly selected direction
            newEnemyX = enemy.x + enemy.dx;
            newEnemyY = enemy.y + enemy.dy;
            if (newEnemyX < 0) newEnemyX = maze[0].length - 1;
            if (newEnemyX >= maze[0].length) newEnemyX = 0;
            
            if (isValidPosition(newEnemyX, newEnemyY)) {
                // Add fire trail effect
                enemyTrails.push({
                    x: enemy.x,
                    y: enemy.y,
                    life: 35,
                    maxLife: 35,
                    type: 'movement_trail'
                });
                
                enemy.x = newEnemyX;
                enemy.y = newEnemyY;
            }
        });
    }

    // Check for droplet collection
    for (let i = droplets.length - 1; i >= 0; i--) {
        if (droplets[i].x === player.x && droplets[i].y === player.y) {
            droplets.splice(i, 1);
            dropletsCollected++;
            score++;
            
            // Update UI
            updateScore();
            updateBottle();
            
            // Create water particle effect
            if (canvas) {
                const canvasRect = canvas.getBoundingClientRect();
                const particleX = canvasRect.left + (player.x * gridSize * (canvasRect.width / (maze[0].length * gridSize)));
                const particleY = canvasRect.top + (player.y * gridSize * (canvasRect.height / (maze.length * gridSize)));
                createWaterParticle(particleX, particleY);
            }
        }
    }

    // Check for debuff collection (red pills)
    for (let i = debuffs.length - 1; i >= 0; i--) {
        if (debuffs[i].x === player.x && debuffs[i].y === player.y) {
            debuffs.splice(i, 1);
            
            // Apply debuff effects
            applyDebuff();
            
            // Create debuff particle effect
            if (canvas) {
                const canvasRect = canvas.getBoundingClientRect();
                const particleX = canvasRect.left + (player.x * gridSize * (canvasRect.width / (maze[0].length * gridSize)));
                const particleY = canvasRect.top + (player.y * gridSize * (canvasRect.height / (maze.length * gridSize)));
                createDebuffParticle(particleX, particleY);
            }
            
            // Lose points for eating debuff
            score = Math.max(0, score - 100);
            updateScore();
        }
    }
    
    // Handle power pellet timer
    if (powerPelletActive) {
        powerPelletTimer--;
        if (powerPelletTimer <= 0) {
            powerPelletActive = false;
        }
    }
    
    // Update enemy trails
    for (let i = enemyTrails.length - 1; i >= 0; i--) {
        enemyTrails[i].life--;
        if (enemyTrails[i].life <= 0) {
            enemyTrails.splice(i, 1);
        }
    }
    
    // Update player animation
    if (player.dx !== 0 || player.dy !== 0) {
        // Animate when moving
        if (frameCount % animationSpeed === 0) {
            playerAnimFrame = (playerAnimFrame + 1) % 3;
        }
    } else {
        // Default to closed mouth when not moving
        playerAnimFrame = 0;
    }

     // Check for enemy collision
    for(let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        // Check collision with larger enemy hitbox
        const enemySize = 1.4; // Same as the visual size multiplier
        const distance = Math.sqrt(
            Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2)
        );
        
        if (distance < enemySize * 0.7) { // Slightly smaller than visual size for fair gameplay
            if (powerPelletActive) {
                // Eat the enemy
                enemies.splice(i, 1);
                score += 200;
                updateScore();
                
                // Create explosion effect
                for (let j = 0; j < 8; j++) {
                    const angle = (j / 8) * Math.PI * 2;
                    const explosionDistance = gridSize * 0.5;
                    enemyTrails.push({
                        x: enemy.x + Math.cos(angle) * explosionDistance / gridSize,
                        y: enemy.y + Math.sin(angle) * explosionDistance / gridSize,
                        life: 25,
                        maxLife: 25,
                        type: 'explosion'
                    });
                }
            } else {
                // Take damage
                damagePlayer();
                return; // Exit early to prevent multiple hits
            }
        }
    }

    // Win condition
    if (droplets.length === 0) {
        gameState = 'victory';
    }
}

function handleKeyPress(e) {
    switch(e.key) {
        case 'ArrowUp': movePlayer(0, -1); break;
        case 'ArrowDown': movePlayer(0, 1); break;
        case 'ArrowLeft': movePlayer(-1, 0); break;
        case 'ArrowRight': movePlayer(1, 0); break;
        case ' ': // Spacebar for pause
        case 'p':
        case 'P':
            e.preventDefault();
            togglePause();
            break;
        case 'm':
        case 'M':
            toggleAudio();
            break;
        case 'r':
        case 'R':
            if (gameState === 'gameOver' || gameState === 'victory') {
                restartGame();
            }
            break;
    }
}

function restartGame() {
    // Reset game state
    gameState = 'playing';
    score = 0;
    frameCount = 0;
    powerPelletActive = false;
    powerPelletTimer = 0;
    playerAnimFrame = 0;
    playerHealth = maxHealth;
    dropletsCollected = 0;
    gameSpeed = 8; // Reset game speed
    
    // Reset player
    player = { x: 1, y: 3, dx: 0, dy: 0 };
    
    // Reset enemies
    enemies = [
        { x: 9, y: 9, dx: 1, dy: 0 },
        { x: 10, y: 9, dx: -1, dy: 0 },
        { x: 9, y: 8, dx: 0, dy: 1 },
        { x: 10, y: 10, dx: 0, dy: -1 }
    ];
    
    // Reset collectibles and trails
    droplets = [];
    debuffs = [];
    enemyTrails = [];
    
    // Reset debuff positions
    debuffPositions = [
        { x: 18, y: 1 },
        { x: 1, y: 18 },
        { x: 18, y: 18 },
        { x: 1, y: 1 }
    ];
    
    debuffs = debuffPositions.map(pos => ({ x: pos.x, y: pos.y, type: 'debuff' }));
    
    // Recalculate total droplets (avoid debuff positions)
    totalDroplets = 0;
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            if (maze[y][x] === 0) {
                // Check if this position conflicts with any debuff
                const conflictsWithDebuff = debuffPositions.some(pos => pos.x === x && pos.y === y);
                if (!conflictsWithDebuff) {
                    droplets.push({ x, y });
                    totalDroplets++;
                }
            }
        }
    }
    
    // Update UI
    updateHealth();
    updateBottle();
    updateScore();
    
    // Reset score in bottom status bar
    const statusScoreElement = document.getElementById('score-value');
    if (statusScoreElement) {
        statusScoreElement.textContent = score;
    }
}

function movePlayer(dx, dy) {
    if (gameState === 'playing') {
        player.dx = dx;
        player.dy = dy;
    }
}

function gameLoop() {
    try {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    } catch (error) {
        console.error('Error in game loop:', error);
    }
}

// Start the game immediately without waiting for assets
console.log('Starting game...');
setup();

// Load assets in background
originalPlayerImg.onload = () => console.log('Original player image loaded');
dropletImg.onload = () => console.log('Droplet image loaded');
debuffImg.onload = () => console.log('Debuff image loaded');

// Load enemy animation frames
enemyImgs.leftUp.onload = () => console.log('Enemy Left Up loaded');
enemyImgs.leftDown.onload = () => console.log('Enemy Left Down loaded');
enemyImgs.rightUp.onload = () => console.log('Enemy Right Up loaded');
enemyImgs.rightDown.onload = () => console.log('Enemy Right Down loaded');
enemyImgs.openMouth.onload = () => console.log('Enemy Open Mouth loaded');
enemyImgs.default.onload = () => console.log('Enemy default loaded');

// Load animation frames
playerImgs.closed.onload = () => console.log('Closed frame loaded');
playerImgs.halfOpen.onload = () => console.log('Half open frame loaded');
playerImgs.fullOpen.onload = () => console.log('Full open frame loaded');

// Add error handlers
originalPlayerImg.onerror = () => console.error('Failed to load original player image');
dropletImg.onerror = () => console.error('Failed to load droplet image');
debuffImg.onerror = () => console.error('Failed to load debuff image');

// Enemy error handlers
enemyImgs.leftUp.onerror = () => console.error('Failed to load Enemy Left Up');
enemyImgs.leftDown.onerror = () => console.error('Failed to load Enemy Left Down');
enemyImgs.rightUp.onerror = () => console.error('Failed to load Enemy Right Up');
enemyImgs.rightDown.onerror = () => console.error('Failed to load Enemy Right Down');
enemyImgs.openMouth.onerror = () => console.error('Failed to load Enemy Open Mouth');
enemyImgs.default.onerror = () => console.error('Failed to load Enemy default');
playerImgs.closed.onerror = () => console.error('Failed to load closed frame');
playerImgs.halfOpen.onerror = () => console.error('Failed to load half open frame');
playerImgs.fullOpen.onerror = () => console.error('Failed to load full open frame'); 