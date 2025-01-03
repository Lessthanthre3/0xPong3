class PongGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        
        // Game state
        this.gameStarted = false;
        this.gamePaused = true;
        
        // Game objects
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            radius: 10,
            speed: 5,
            dx: 5,
            dy: 5
        };
        
        this.playerPaddle = {
            x: 50,
            y: this.canvas.height / 2,
            width: 10,
            height: 100,
            speed: 8,
            score: 0
        };
        
        this.aiPaddle = {
            x: this.canvas.width - 60,
            y: this.canvas.height / 2,
            width: 10,
            height: 100,
            speed: 5,
            score: 0
        };

        // Sound effects setup
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // AI settings
        this.aiSettings = {
            baseSpeed: 7,
            reactionDelay: 0.15,
            predictionError: 20,
            difficultyMultiplier: 1
        };

        // Player rating (will be updated from server)
        this.playerRating = 1000;

        // Get DOM elements
        this.overlay = document.getElementById('game-overlay');
        this.startButton = document.getElementById('start-button');
        this.countdown = document.getElementById('countdown');
        this.countdownNumber = document.querySelector('.countdown-number');

        // Bind event listeners
        this.bindEvents();
        
        // Start render loop
        this.lastTime = 0;
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    setupCanvas() {
        // Set canvas size based on container
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    bindEvents() {
        // Mouse movement
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.gamePaused) {
                const rect = this.canvas.getBoundingClientRect();
                const mouseY = e.clientY - rect.top;
                this.playerPaddle.y = mouseY - this.playerPaddle.height / 2;
                this.clampPaddle(this.playerPaddle);
            }
        });

        // Touch events for mobile
        this.canvas.addEventListener('touchmove', (e) => {
            if (!this.gamePaused) {
                e.preventDefault();
                const rect = this.canvas.getBoundingClientRect();
                const touch = e.touches[0];
                const touchY = touch.clientY - rect.top;
                this.playerPaddle.y = touchY - this.playerPaddle.height / 2;
                this.clampPaddle(this.playerPaddle);
            }
        }, { passive: false });

        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            if (!this.gamePaused) {
                if (e.key === 'ArrowUp') {
                    this.playerPaddle.y -= this.playerPaddle.speed;
                } else if (e.key === 'ArrowDown') {
                    this.playerPaddle.y += this.playerPaddle.speed;
                }
                this.clampPaddle(this.playerPaddle);
            }
        });

        // Start button
        this.startButton.addEventListener('click', () => {
            this.initializeGame();
        });
    }

    async initializeGame() {
        try {
            // Get player stats
            const response = await fetch(`/api/stats/${window.walletManager.getWalletAddress()}`);
            const stats = await response.json();
            this.playerRating = stats.rating || 1000;
            
            // Adjust AI difficulty based on player rating
            this.updateAIDifficulty();
            
            this.startGame();
        } catch (error) {
            console.error('Error initializing game:', error);
            this.startGame(); // Start anyway with default settings
        }
    }

    updateAIDifficulty() {
        const ratingDiff = this.playerRating - 1000; // Base rating difference
        
        // Adjust AI settings based on player rating
        this.aiSettings.difficultyMultiplier = Math.min(Math.max(
            0.8 + (ratingDiff / 1000) * 0.4, // Scales from 0.8 to 1.2 based on rating
            0.8  // Minimum multiplier
        ), 1.2); // Maximum multiplier

        // Apply difficulty multiplier to AI parameters
        this.aiSettings.speed = this.aiSettings.baseSpeed * this.aiSettings.difficultyMultiplier;
        this.aiSettings.reactionDelay = 0.15 / this.aiSettings.difficultyMultiplier;
        this.aiSettings.predictionError = 20 + (1 - this.aiSettings.difficultyMultiplier) * 15;
    }

    async startGame() {
        if (!window.walletManager.getWalletAddress()) {
            alert('Please connect your wallet to play!');
            return;
        }

        if (!this.gameStarted) {
            this.gameStarted = true;
            this.playerPaddle.score = 0;
            this.aiPaddle.score = 0;
            document.getElementById('player-score').textContent = '0';
            document.getElementById('ai-score').textContent = '0';
        }
        
        this.overlay.classList.remove('active');
        await this.startCountdown(true);
        this.gamePaused = false;
    }

    async startCountdown(isGameStart = false) {
        this.countdown.classList.add('active');
        
        const countFrom = isGameStart ? 3 : 2;
        const delay = isGameStart ? 1000 : 750;
        
        for (let i = countFrom; i > 0; i--) {
            this.countdownNumber.textContent = i;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        this.countdown.classList.remove('active');
    }

    checkWinCondition() {
        const winningScore = 15;
        if (this.playerPaddle.score >= winningScore || this.aiPaddle.score >= winningScore) {
            const playerWon = this.playerPaddle.score >= winningScore;
            const winner = playerWon ? 'Player' : 'AI';
            this.gamePaused = true;
            this.gameStarted = false;
            
            // Record game result in stats
            const walletAddress = window.walletManager.getWalletAddress();
            if (walletAddress && window.gameStats) {
                window.gameStats.recordGame(walletAddress, playerWon);
            }
            
            // Update overlay text and show it
            this.startButton.textContent = 'Play Again';
            const winnerText = document.createElement('div');
            winnerText.className = 'winner-text';
            winnerText.textContent = `${winner} Wins!`;
            this.overlay.insertBefore(winnerText, this.startButton);
            this.overlay.classList.add('active');
            
            // Clean up previous winner text when starting new game
            this.startButton.addEventListener('click', () => {
                if (winnerText.parentNode) {
                    winnerText.remove();
                }
                this.startButton.textContent = 'Start Game';
            }, { once: true });
            
            return true;
        }
        return false;
    }

    clampPaddle(paddle) {
        paddle.y = Math.max(0, Math.min(this.canvas.height - paddle.height, paddle.y));
    }

    updateAISettings(settings) {
        this.aiSettings = { ...this.aiSettings, ...settings };
    }

    updateAI() {
        if (this.gamePaused) return;

        // Predict where the ball will intersect with AI's x position
        const ballSpeed = Math.sqrt(this.ball.dx * this.ball.dx + this.ball.dy * this.ball.dy);
        const timeToIntercept = Math.abs((this.aiPaddle.x - this.ball.x) / this.ball.dx);
        const predictedY = this.ball.y + this.ball.dy * timeToIntercept;
        
        // Add some randomness to make AI feel more natural but still challenging
        const reactionDelay = Math.random() * this.aiSettings.reactionDelay;
        const predictionError = (Math.random() - 0.5) * this.aiSettings.predictionError;
        const targetY = predictedY + predictionError;

        // Only move if the ball is moving towards the AI
        if (this.ball.dx > 0) {
            const paddleCenter = this.aiPaddle.y + this.aiPaddle.height / 2;
            
            if (paddleCenter < targetY - 10) {
                this.aiPaddle.y += this.aiSettings.speed;
            } else if (paddleCenter > targetY + 10) {
                this.aiPaddle.y -= this.aiSettings.speed;
            }
        } else {
            // Return to center when ball is moving away
            const centerY = this.canvas.height / 2 - this.aiPaddle.height / 2;
            const returnSpeed = this.aiSettings.speed * 0.4;
            if (Math.abs(this.aiPaddle.y - centerY) > returnSpeed) {
                if (this.aiPaddle.y > centerY) {
                    this.aiPaddle.y -= returnSpeed;
                } else {
                    this.aiPaddle.y += returnSpeed;
                }
            }
        }

        // Ensure paddle stays within canvas bounds
        this.clampPaddle(this.aiPaddle);
    }

    async updateBall() {
        if (this.gamePaused) return;

        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;

        // Wall collisions
        if (this.ball.y - this.ball.radius < 0 || 
            this.ball.y + this.ball.radius > this.canvas.height) {
            this.ball.dy *= -1;
        }

        // Paddle collisions
        [this.playerPaddle, this.aiPaddle].forEach(paddle => {
            if (this.checkPaddleCollision(paddle)) {
                this.ball.dx *= -1.1; // Increase speed slightly
                const paddleCenter = paddle.y + paddle.height / 2;
                const ballRelativeY = this.ball.y - paddleCenter;
                this.ball.dy = ballRelativeY * 0.2;
                this.playPaddleHitSound();
            }
        });

        // Scoring
        if (this.ball.x < 0) {
            this.aiPaddle.score++;
            document.getElementById('ai-score').textContent = this.aiPaddle.score;
            
            if (!this.checkWinCondition()) {
                this.gamePaused = true;
                await this.startCountdown(false);
                this.resetBall();
                this.gamePaused = false;
            }
        } else if (this.ball.x > this.canvas.width) {
            this.playerPaddle.score++;
            document.getElementById('player-score').textContent = this.playerPaddle.score;
            
            if (!this.checkWinCondition()) {
                this.gamePaused = true;
                await this.startCountdown(false);
                this.resetBall();
                this.gamePaused = false;
            }
        }
    }

    checkPaddleCollision(paddle) {
        return this.ball.x + this.ball.radius > paddle.x &&
               this.ball.x - this.ball.radius < paddle.x + paddle.width &&
               this.ball.y + this.ball.radius > paddle.y &&
               this.ball.y - this.ball.radius < paddle.y + paddle.height;
    }

    playPaddleHitSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Set sound properties
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime); // A3 note
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        // Play sound
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        this.ball.dx = (Math.random() > 0.5 ? 1 : -1) * this.ball.speed;
        this.ball.dy = (Math.random() * 2 - 1) * this.ball.speed;
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw center line
        this.ctx.setLineDash([5, 15]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Draw ball with glow effect
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#00f3ff';
        this.ctx.shadowColor = '#00f3ff';
        this.ctx.shadowBlur = 10;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Draw paddles with glow effect
        [this.playerPaddle, this.aiPaddle].forEach(paddle => {
            this.ctx.fillStyle = '#ff00ff';
            this.ctx.shadowColor = '#ff00ff';
            this.ctx.shadowBlur = 10;
            this.ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
            this.ctx.shadowBlur = 0;
        });
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        if (deltaTime < 160) { // Skip update if frame time is too high
            this.updateBall();
            this.updateAI();
        }

        this.draw();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
}

// Initialize game when window loads
window.addEventListener('load', () => {
    new PongGame();
});
