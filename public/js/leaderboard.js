class Leaderboard {
    constructor() {
        this.leaderboardElement = document.getElementById('leaderboard-entries');
        this.updateInterval = 5000; // Update every 5 seconds
        this.init();
    }

    init() {
        this.updateLeaderboard();
        setInterval(() => this.updateLeaderboard(), this.updateInterval);
    }

    getPlayerStats() {
        // Get stats from the GameStats class
        if (!window.gameStats) return new Map();
        return window.gameStats.stats.playerStats;
    }

    calculateLeaderboard() {
        const stats = this.getPlayerStats();
        const players = [];

        // Convert player stats to array for sorting
        stats.forEach((playerData, walletAddress) => {
            players.push({
                wallet: walletAddress,
                rating: playerData.rating,
                wins: playerData.wins,
                losses: playerData.losses,
                winRate: playerData.gamesPlayed > 0 
                    ? ((playerData.wins / playerData.gamesPlayed) * 100).toFixed(1)
                    : '0.0'
            });
        });

        // Sort by rating (descending)
        return players.sort((a, b) => b.rating - a.rating);
    }

    formatWalletAddress(address) {
        if (address.length <= 8) return address;
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }

    getRankEmoji(index) {
        switch(index) {
            case 0: return '👑'; // Crown for 1st
            case 1: return '🥈'; // Silver for 2nd
            case 2: return '🥉'; // Bronze for 3rd
            default: return '⭐'; // Star for others
        }
    }

    updateLeaderboard() {
        const players = this.calculateLeaderboard();
        let html = '<div class="leaderboard-header">' +
                  '<span class="rank">Rank</span>' +
                  '<span class="player">Player</span>' +
                  '<span class="rating">Rating</span>' +
                  '<span class="winrate">Win Rate</span>' +
                  '</div>';

        // Show top 10 players
        players.slice(0, 10).forEach((player, index) => {
            const rank = index + 1;
            html += `
                <div class="leaderboard-row ${rank <= 3 ? 'top-three' : ''}">
                    <span class="rank">${this.getRankEmoji(index)} ${rank}</span>
                    <span class="player">${this.formatWalletAddress(player.wallet)}</span>
                    <span class="rating">${Math.round(player.rating)}</span>
                    <span class="winrate">${player.winRate}%</span>
                </div>
            `;
        });

        if (players.length === 0) {
            html += '<div class="no-players">No players yet. Be the first to play!</div>';
        }

        this.leaderboardElement.innerHTML = html;
    }
}

// Initialize leaderboard when window loads
window.addEventListener('load', () => {
    window.leaderboard = new Leaderboard();
});
