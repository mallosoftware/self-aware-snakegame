// Game constants
const GRID_SIZE = 20;
const CELL_SIZE = 25;
const GAME_SPEED = 150; // milliseconds between moves
const CANVAS_SIZE = 500;

// Game variables
let snake = [];
let food = {
    x: 0,
    y: 0,
    moveCounter: 0,
    moveDelay: 4, // Food moves every X snake moves (higher = slower)
    direction: 'right'
};
let direction = 'right';
let nextDirection = 'right';
let score = 0;
let gameRunning = false;
let gameLoop;
let thoughtTimer;
let dangerDistance = 3; // How far ahead the snake looks for walls
let backgroundColor = '#222'; // Default background color
let appleEmoji = "🍎"; // Apple emoji for food

// Explosion animation variables
let explosion = {
    active: false,
    x: 0,
    y: 0,
    particles: [],
    duration: 15, // frames
    currentFrame: 0
};

// Background color options
const backgroundColors = [
    '#222', // Dark gray (default)
    '#1a2639', // Dark blue
    '#2c3e50', // Midnight blue
    '#3c1642', // Dark purple
    '#4b1d3f', // Dark magenta
    '#541b2c', // Dark maroon
    '#331832', // Dark violet
    '#242424', // Charcoal
    '#1e2d2f', // Dark teal
    '#2d2d2d'  // Darker gray
];

// Snake personality
const thoughts = {
    hungry: [
        "I'm so hungry right now!",
        "Need food... must find food...",
        "Is that food I smell?",
        "My stomach is growling...",
        "Food is life, food is love."
    ],
    excited: [
        "Yes! Got it!",
        "Delicious!",
        "Growing stronger!",
        "Size matters!",
        "I'm getting longer!"
    ],
    worried: [
        "This is getting tight...",
        "I don't like where this is going...",
        "I should be more careful...",
        "I'm feeling trapped!",
        "Too many turns, I might get confused!"
    ],
    bored: [
        "Just another day as a snake...",
        "Left, right, up, down... repeat...",
        "Is this all there is to life?",
        "Sometimes I dream of being a mongoose...",
        "What's the meaning of snake life?"
    ],
    proud: [
        "Look at my length!",
        "I'm pretty good at this!",
        "Snake master in the house!",
        "I was born for this!",
        "Watch and learn, humans!"
    ],
    nearDeath: [
        "I'm going to crash!",
        "DANGER! DANGER!",
        "This is not going to end well...",
        "I've made a terrible mistake!",
        "I regret everything!"
    ]
};

// DOM elements
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const thoughtsElement = document.getElementById('snake-thoughts');
const gameOverElement = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const finalThoughtElement = document.getElementById('final-thought');
const restartButton = document.getElementById('restart-button');

// Initialize the game
function initGame() {
    // Create initial snake (3 segments)
    snake = [
        { x: 6, y: 10 },
        { x: 5, y: 10 },
        { x: 4, y: 10 }
    ];
    
    // Create initial food
    createFood();
    
    // Reset game state
    score = 0;
    direction = 'right';
    nextDirection = 'right';
    gameRunning = true;
    
    // Update UI
    scoreElement.textContent = `Score: ${score}`;
    gameOverElement.style.display = 'none';
    
    // Start thinking
    displayRandomThought('bored');
    
    // Start game loop
    clearInterval(gameLoop);
    gameLoop = setInterval(gameStep, GAME_SPEED);
    
    // Start thought timer
    clearInterval(thoughtTimer);
    thoughtTimer = setInterval(() => {
        if (gameRunning) {
            decideThought();
        }
    }, 3000);
}

// Create food at random position (not on snake)
function createFood() {
    let foodPosition;
    do {
        foodPosition = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE),
            moveCounter: 0,
            moveDelay: 4, // Food moves every X snake moves (higher = slower)
            direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)]
        };
    } while (snake.some(segment => segment.x === foodPosition.x && segment.y === foodPosition.y));
    
    food = foodPosition;
}

// Main game step
function gameStep() {
    // Update snake position
    moveSnake();
    
    // Move food occasionally
    moveFood();
    
    // Check for collisions
    if (checkCollision()) {
        endGame();
        return;
    }
    
    // Check if food eaten
    if (snake[0].x === food.x && snake[0].y === food.y) {
        // Grow snake
        // Don't remove the tail segment, which effectively makes the snake longer
        
        // Update score
        score += 10;
        scoreElement.textContent = `Score: ${score}`;
        
        // Change background color
        changeBackgroundColor();
        
        // Create explosion at food location
        createExplosion(food.x, food.y);
        
        // Create new food
        createFood();
        
        // Snake is happy
        displayRandomThought('excited');
    } else {
        // Remove tail segment
        snake.pop();
    }
    
    // Update explosion animation
    if (explosion.active) {
        updateExplosion();
    }
    
    // Draw everything
    draw();
}

// Move the snake one step in the current direction
function moveSnake() {
    // Update direction from nextDirection
    direction = nextDirection;
    
    // Calculate new head position
    const head = { ...snake[0] };
    
    switch (direction) {
        case 'up':
            head.y -= 1;
            break;
        case 'down':
            head.y += 1;
            break;
        case 'left':
            head.x -= 1;
            break;
        case 'right':
            head.x += 1;
            break;
    }
    
    // Add new head to the beginning of snake array
    snake.unshift(head);
}

// Check for collisions with walls or self
function checkCollision() {
    const head = snake[0];
    
    // Check wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        return true;
    }
    
    // Check self collision (skip the head)
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    return false;
}

// Draw the game state
function draw() {
    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Draw snake
    snake.forEach((segment, index) => {
        // Head is a different color
        if (index === 0) {
            ctx.fillStyle = '#4CAF50'; // Green head
        } else {
            // Gradient from green to dark green
            const colorValue = Math.max(50, 200 - (index * 3));
            ctx.fillStyle = `rgb(${colorValue / 2}, ${colorValue}, ${colorValue / 2})`;
        }
        
        ctx.fillRect(
            segment.x * CELL_SIZE,
            segment.y * CELL_SIZE,
            CELL_SIZE,
            CELL_SIZE
        );
        
        // Draw eyes on head
        if (index === 0) {
            ctx.fillStyle = 'white';
            
            // Position eyes based on direction
            let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
            const eyeSize = CELL_SIZE / 5;
            const eyeOffset = CELL_SIZE / 3;
            
            switch (direction) {
                case 'up':
                    leftEyeX = segment.x * CELL_SIZE + eyeOffset;
                    leftEyeY = segment.y * CELL_SIZE + eyeOffset;
                    rightEyeX = segment.x * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize;
                    rightEyeY = segment.y * CELL_SIZE + eyeOffset;
                    break;
                case 'down':
                    leftEyeX = segment.x * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize;
                    leftEyeY = segment.y * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize;
                    rightEyeX = segment.x * CELL_SIZE + eyeOffset;
                    rightEyeY = segment.y * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize;
                    break;
                case 'left':
                    leftEyeX = segment.x * CELL_SIZE + eyeOffset;
                    leftEyeY = segment.y * CELL_SIZE + eyeOffset;
                    rightEyeX = segment.x * CELL_SIZE + eyeOffset;
                    rightEyeY = segment.y * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize;
                    break;
                case 'right':
                    leftEyeX = segment.x * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize;
                    leftEyeY = segment.y * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize;
                    rightEyeX = segment.x * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize;
                    rightEyeY = segment.y * CELL_SIZE + eyeOffset;
                    break;
            }
            
            ctx.fillRect(leftEyeX, leftEyeY, eyeSize, eyeSize);
            ctx.fillRect(rightEyeX, rightEyeY, eyeSize, eyeSize);
        }
    });
    
    // Draw food as apple emoji
    ctx.font = `${CELL_SIZE * 0.8}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
        appleEmoji,
        food.x * CELL_SIZE + CELL_SIZE / 2,
        food.y * CELL_SIZE + CELL_SIZE / 2
    );
    
    // Draw explosion if active
    if (explosion.active) {
        drawExplosion();
    }
}

// End the game
function endGame() {
    gameRunning = false;
    clearInterval(gameLoop);
    clearInterval(thoughtTimer);
    
    // Display game over screen
    finalScoreElement.textContent = `Score: ${score}`;
    finalThoughtElement.textContent = `Snake's final thought: ${getRandomThought('nearDeath')}`;
    gameOverElement.style.display = 'block';
}

// Handle keyboard input
document.addEventListener('keydown', (event) => {
    if (!gameRunning) return;
    
    switch (event.key) {
        case 'ArrowUp':
            if (direction !== 'down') nextDirection = 'up';
            break;
        case 'ArrowDown':
            if (direction !== 'up') nextDirection = 'down';
            break;
        case 'ArrowLeft':
            if (direction !== 'right') nextDirection = 'left';
            break;
        case 'ArrowRight':
            if (direction !== 'left') nextDirection = 'right';
            break;
    }
});

// Restart button
restartButton.addEventListener('click', initGame);

// Display a random thought from a category
function displayRandomThought(category) {
    const thought = getRandomThought(category);
    thoughtsElement.textContent = `Snake is thinking: ${thought}`;
}

// Get a random thought from a category
function getRandomThought(category) {
    const categoryThoughts = thoughts[category];
    const randomIndex = Math.floor(Math.random() * categoryThoughts.length);
    return categoryThoughts[randomIndex];
}

// Self-awareness: Snake decides what to think based on game state
function decideThought() {
    // Check distance to food
    const distanceToFood = Math.abs(snake[0].x - food.x) + Math.abs(snake[0].y - food.y);
    
    // Check if snake is about to hit a wall
    const head = snake[0];
    let dangerAhead = false;
    
    // Look ahead in the current direction
    let checkX = head.x;
    let checkY = head.y;
    
    for (let i = 0; i < dangerDistance; i++) {
        switch (direction) {
            case 'up': checkY--; break;
            case 'down': checkY++; break;
            case 'left': checkX--; break;
            case 'right': checkX++; break;
        }
        
        // Check if this position would be a collision
        if (checkX < 0 || checkX >= GRID_SIZE || checkY < 0 || checkY >= GRID_SIZE) {
            dangerAhead = true;
            break;
        }
        
        // Check if any snake segment is at this position
        for (let j = 1; j < snake.length; j++) {
            if (checkX === snake[j].x && checkY === snake[j].y) {
                dangerAhead = true;
                break;
            }
        }
        
        if (dangerAhead) break;
    }
    
    // Decide what to think
    if (dangerAhead) {
        displayRandomThought('worried');
        
        // If very close to danger, panic!
        if (checkX === head.x + 1 && direction === 'right' ||
            checkX === head.x - 1 && direction === 'left' ||
            checkY === head.y + 1 && direction === 'down' ||
            checkY === head.y - 1 && direction === 'up') {
            displayRandomThought('nearDeath');
        }
    } else if (distanceToFood <= 3) {
        displayRandomThought('hungry');
    } else if (score > 50 && Math.random() < 0.3) {
        displayRandomThought('proud');
    } else {
        // Random thoughts when nothing special is happening
        const randomCategory = Math.random() < 0.7 ? 'bored' : 'hungry';
        displayRandomThought(randomCategory);
    }
    
    // Self-preservation: Try to avoid walls if danger is ahead
    if (dangerAhead && gameRunning) {
        smartAvoidance();
    }
}

// Self-preservation: Snake tries to avoid walls
function smartAvoidance() {
    const head = snake[0];
    
    // Current direction
    let possibleDirections = [];
    
    // Check which directions are safe
    if (direction !== 'down' && head.y > 0 && !isSnakeSegmentAt(head.x, head.y - 1)) {
        possibleDirections.push('up');
    }
    if (direction !== 'up' && head.y < GRID_SIZE - 1 && !isSnakeSegmentAt(head.x, head.y + 1)) {
        possibleDirections.push('down');
    }
    if (direction !== 'right' && head.x > 0 && !isSnakeSegmentAt(head.x - 1, head.y)) {
        possibleDirections.push('left');
    }
    if (direction !== 'left' && head.x < GRID_SIZE - 1 && !isSnakeSegmentAt(head.x + 1, head.y)) {
        possibleDirections.push('right');
    }
    
    // If there are safe directions, choose one randomly
    if (possibleDirections.length > 0) {
        const randomIndex = Math.floor(Math.random() * possibleDirections.length);
        nextDirection = possibleDirections[randomIndex];
    }
}

// Check if there's a snake segment at the given position
function isSnakeSegmentAt(x, y) {
    return snake.some(segment => segment.x === x && segment.y === y);
}

// Change the background color randomly
function changeBackgroundColor() {
    let newColorIndex;
    do {
        newColorIndex = Math.floor(Math.random() * backgroundColors.length);
    } while (backgroundColors[newColorIndex] === backgroundColor);
    
    backgroundColor = backgroundColors[newColorIndex];
}

// Create explosion particles at the given grid position
function createExplosion(gridX, gridY) {
    // Convert grid position to canvas position (center of cell)
    const centerX = gridX * CELL_SIZE + CELL_SIZE / 2;
    const centerY = gridY * CELL_SIZE + CELL_SIZE / 2;
    
    // Create particles
    explosion.particles = [];
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2; // Random angle
        const speed = 1 + Math.random() * 3; // Random speed
        const size = 2 + Math.random() * 3; // Random size
        
        // Random color from a bright palette
        const colors = ['#FF5722', '#FFC107', '#FFEB3B', '#F44336', '#E91E63'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        explosion.particles.push({
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: size,
            color: color,
            alpha: 1.0
        });
    }
    
    // Activate explosion
    explosion.active = true;
    explosion.x = centerX;
    explosion.y = centerY;
    explosion.currentFrame = 0;
}

// Update explosion animation
function updateExplosion() {
    explosion.currentFrame++;
    
    if (explosion.currentFrame >= explosion.duration) {
        explosion.active = false;
        return;
    }
    
    // Update each particle
    explosion.particles.forEach(particle => {
        // Move particle
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Fade out particle
        particle.alpha = 1.0 - (explosion.currentFrame / explosion.duration);
    });
}

// Draw explosion
function drawExplosion() {
    explosion.particles.forEach(particle => {
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Reset global alpha
    ctx.globalAlpha = 1.0;
}

// Move the food occasionally
function moveFood() {
    // Increment counter
    food.moveCounter++;
    
    // Only move food every X snake moves
    if (food.moveCounter < food.moveDelay) {
        return;
    }
    
    // Reset counter
    food.moveCounter = 0;
    
    // Randomly change direction sometimes
    if (Math.random() < 0.3) {
        const directions = ['up', 'down', 'left', 'right'];
        food.direction = directions[Math.floor(Math.random() * directions.length)];
    }
    
    // Calculate new position
    let newX = food.x;
    let newY = food.y;
    
    switch (food.direction) {
        case 'up':
            newY--;
            break;
        case 'down':
            newY++;
            break;
        case 'left':
            newX--;
            break;
        case 'right':
            newX++;
            break;
    }
    
    // Check if new position is valid (not off grid and not on snake)
    if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE ||
        snake.some(segment => segment.x === newX && segment.y === newY)) {
        // If invalid, change to a random direction
        const directions = ['up', 'down', 'left', 'right'];
        food.direction = directions[Math.floor(Math.random() * directions.length)];
        return; // Don't move this time
    }
    
    // Update food position
    food.x = newX;
    food.y = newY;
}

// Start the game when the page loads
window.onload = initGame;
