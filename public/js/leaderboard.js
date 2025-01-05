class Leaderboard {
    constructor() {
        this.leaderboardElement = document.getElementById('leaderboard-entries');
        this.init();
    }

    init() {
        // Initial update
        this.updateLeaderboard();
        
        // Subscribe to real-time updates
        if (window.wsClient) {
            window.wsClient.subscribe('leaderboardUpdate', (data) => {
                this.updateLeaderboardDisplay(data);
            });
        }
    }

    async updateLeaderboard() {
        try {
            const response = await fetch('/api/leaderboard');
            const data = await response.json();
            this.updateLeaderboardDisplay(data);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        }
    }

    updateLeaderboardDisplay(players) {
        // Clear existing entries
        this.leaderboardElement.innerHTML = '';

        // Sort players by rating
        players.sort((a, b) => b.rating - a.rating);

        // Create and append new entries
        players.forEach((player, index) => {
            const row = document.createElement('div');
            row.className = 'leaderboard-row';
            row.innerHTML = `
                <span class="rank">#${index + 1}</span>
                <span class="wallet">${this.formatWallet(player.wallet)}</span>
                <span class="rating">${player.rating}</span>
                <span class="win-rate">${player.winRate}%</span>
            `;
            this.leaderboardElement.appendChild(row);
        });
    }

    formatWallet(wallet) {
        return wallet.substring(0, 4) + '...' + wallet.substring(wallet.length - 4);
    }
}

// Initialize leaderboard when window loads
window.addEventListener('load', () => {
    window.leaderboard = new Leaderboard();
});
