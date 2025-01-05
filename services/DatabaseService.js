const mongoose = require('mongoose');

// Game Schema
const gameSchema = new mongoose.Schema({
    playerWallet: String,
    playerScore: Number,
    aiScore: Number,
    duration: Number,
    timestamp: { type: Date, default: Date.now }
});

const Game = mongoose.model('Game', gameSchema);

// Player Stats Schema
const playerStatsSchema = new mongoose.Schema({
    walletAddress: { type: String, unique: true },
    gamesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    rating: { type: Number, default: 1000 },
    lastPlayed: { type: Date, default: Date.now }
});

const PlayerStats = mongoose.model('PlayerStats', playerStatsSchema);

class DatabaseService {
    constructor() {
        this.subscribers = new Set();
    }

    addSubscriber(ws) {
        this.subscribers.add(ws);
    }

    removeSubscriber(ws) {
        this.subscribers.delete(ws);
    }

    broadcastUpdate(type, data) {
        const message = JSON.stringify({ type, data });
        this.subscribers.forEach(ws => {
            if (ws.readyState === 1) { // WebSocket.OPEN
                ws.send(message);
            }
        });
    }

    async recordGame(playerWallet, playerScore, aiScore, duration) {
        try {
            // Record game
            const game = new Game({
                playerWallet,
                playerScore,
                aiScore,
                duration
            });
            await game.save();

            // Update player stats
            let playerStats = await PlayerStats.findOne({ walletAddress: playerWallet });
            if (!playerStats) {
                playerStats = new PlayerStats({ walletAddress: playerWallet });
            }

            playerStats.gamesPlayed += 1;
            if (playerScore > aiScore) {
                playerStats.wins += 1;
                playerStats.rating += 25;
            } else {
                playerStats.losses += 1;
                playerStats.rating = Math.max(0, playerStats.rating - 15);
            }
            playerStats.lastPlayed = new Date();
            await playerStats.save();

            // Get updated leaderboard and broadcast
            const leaderboard = await this.getLeaderboard();
            this.broadcastUpdate('leaderboardUpdate', leaderboard);

            return { game, playerStats };
        } catch (error) {
            console.error('Error recording game:', error);
            throw error;
        }
    }

    async getPlayerStats(walletAddress) {
        try {
            let stats = await PlayerStats.findOne({ walletAddress });
            if (!stats) {
                stats = new PlayerStats({ walletAddress });
                await stats.save();
            }
            return stats;
        } catch (error) {
            console.error('Error getting player stats:', error);
            throw error;
        }
    }

    async getLeaderboard(limit = 10) {
        try {
            return await PlayerStats.find()
                .sort('-rating')
                .limit(limit)
                .select('walletAddress rating wins losses gamesPlayed')
                .lean()
                .exec();
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            throw error;
        }
    }

    async getAIStats() {
        try {
            const totalGames = await Game.countDocuments();
            const aiWins = await Game.countDocuments({ $expr: { $gt: ['$aiScore', '$playerScore'] } });
            const uniquePlayers = await Game.distinct('playerWallet').countDocuments();
            const longestWinStreak = await this.calculateAIWinStreak();

            return {
                totalGames,
                aiWins,
                playerWins: totalGames - aiWins,
                uniquePlayers,
                winStreak: longestWinStreak
            };
        } catch (error) {
            console.error('Error getting AI stats:', error);
            throw error;
        }
    }

    async calculateAIWinStreak() {
        try {
            const games = await Game.find()
                .sort('timestamp')
                .select('aiScore playerScore')
                .lean()
                .exec();

            let currentStreak = 0;
            let maxStreak = 0;

            for (const game of games) {
                if (game.aiScore > game.playerScore) {
                    currentStreak++;
                    maxStreak = Math.max(maxStreak, currentStreak);
                } else {
                    currentStreak = 0;
                }
            }

            return maxStreak;
        } catch (error) {
            console.error('Error calculating AI win streak:', error);
            throw error;
        }
    }

    async resetAllData() {
        try {
            await Game.deleteMany({});
            await PlayerStats.deleteMany({});
            return { success: true, message: 'All data has been reset' };
        } catch (error) {
            console.error('Error resetting data:', error);
            throw error;
        }
    }
}

module.exports = new DatabaseService();