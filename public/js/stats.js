class GameStats {
    constructor() {
        this.stats = {
            totalGames: 0,
            aiWins: 0,
            playerWins: 0,
            aiStreak: 0, // Only tracks AI's win streak
            uniquePlayers: new Set(),
            playerStats: new Map() // wallet -> {rating, wins, losses, gamesPlayed}
        };
        
        this.elements = {
            totalGames: document.getElementById('total-games'),
            aiWins: document.getElementById('ai-wins'),
            playerWins: document.getElementById('player-wins'),
            currentStreak: document.getElementById('current-streak'),
            uniquePlayers: document.getElementById('unique-players'),
            playerRating: document.getElementById('player-rating'),
            playerGames: document.getElementById('player-games'),
            playerRecord: document.getElementById('player-record')
        };

        // Initialize from localStorage if available
        this.loadStats();
    }

    loadStats() {
        const savedStats = localStorage.getItem('pongStats');
        if (savedStats) {
            const parsed = JSON.parse(savedStats);
            this.stats.totalGames = parsed.totalGames || 0;
            this.stats.aiWins = parsed.aiWins || 0;
            this.stats.playerWins = parsed.playerWins || 0;
            this.stats.aiStreak = parsed.aiStreak || 0;
            this.stats.uniquePlayers = new Set(parsed.uniquePlayers || []);
            this.stats.playerStats = new Map(parsed.playerStats || []);
            this.updateDisplay();
        }
    }

    saveStats() {
        const statsToSave = {
            ...this.stats,
            uniquePlayers: Array.from(this.stats.uniquePlayers),
            playerStats: Array.from(this.stats.playerStats.entries())
        };
        localStorage.setItem('pongStats', JSON.stringify(statsToSave));
    }

    updatePlayerStats(walletAddress, isWin) {
        if (!this.stats.playerStats.has(walletAddress)) {
            this.stats.playerStats.set(walletAddress, {
                rating: 1000,
                wins: 0,
                losses: 0,
                gamesPlayed: 0
            });
        }

        const playerStats = this.stats.playerStats.get(walletAddress);
        playerStats.gamesPlayed++;
        
        if (isWin) {
            playerStats.wins++;
            playerStats.rating += 3;
        } else {
            playerStats.losses++;
            playerStats.rating = Math.max(0, playerStats.rating - 1.5);
        }

        this.stats.playerStats.set(walletAddress, playerStats);
    }

    recordGame(walletAddress, playerWon) {
        this.stats.totalGames++;
        this.stats.uniquePlayers.add(walletAddress);
        
        if (playerWon) {
            this.stats.playerWins++;
            this.stats.aiStreak = 0; // Reset AI streak when player wins
        } else {
            this.stats.aiWins++;
            this.stats.aiStreak++; // Increment AI streak
        }

        this.updatePlayerStats(walletAddress, playerWon);
        this.updateDisplay();
        this.saveStats();
    }

    updateDisplay() {
        this.elements.totalGames.textContent = this.stats.totalGames;
        this.elements.aiWins.textContent = this.stats.aiWins;
        this.elements.playerWins.textContent = this.stats.playerWins;
        this.elements.currentStreak.textContent = this.stats.aiStreak > 0 ? 
            `${this.stats.aiStreak} wins` : 'None';
        this.elements.uniquePlayers.textContent = this.stats.uniquePlayers.size;
    }

    updateCurrentPlayerDisplay(walletAddress) {
        if (!walletAddress) {
            this.elements.playerRating.textContent = '-';
            this.elements.playerGames.textContent = '-';
            this.elements.playerRecord.textContent = '-';
            return;
        }

        const stats = this.stats.playerStats.get(walletAddress) || {
            rating: 1000,
            wins: 0,
            losses: 0,
            gamesPlayed: 0
        };

        this.elements.playerRating.textContent = Math.round(stats.rating);
        this.elements.playerGames.textContent = stats.gamesPlayed;
        this.elements.playerRecord.textContent = `${stats.wins}/${stats.losses}`;
    }
}

// Initialize stats when window loads
window.addEventListener('load', () => {
    window.gameStats = new GameStats();
});
