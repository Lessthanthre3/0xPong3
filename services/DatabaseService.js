const Player = require('../models/Player');
const Game = require('../models/Game');

class DatabaseService {
    constructor() {
        this.aiWallet = 'AI_PLAYER_ADDRESS';
        this.initializeAI();
        this.K_FACTOR = 32; // ELO K-factor
        this.subscribers = new Set(); // WebSocket subscribers for real-time updates
    }

    // Add WebSocket subscriber
    addSubscriber(ws) {
        this.subscribers.add(ws);
    }

    // Remove WebSocket subscriber
    removeSubscriber(ws) {
        this.subscribers.delete(ws);
    }

    // Broadcast updates to all subscribers
    broadcastUpdate(type, data) {
        const message = JSON.stringify({ type, data });
        this.subscribers.forEach(ws => {
            if (ws.readyState === 1) { // WebSocket.OPEN
                ws.send(message);
            }
        });
    }

    async initializeAI() {
        try {
            let aiPlayer = await Player.findOne({ isAI: true });
            if (!aiPlayer) {
                aiPlayer = new Player({
                    walletAddress: this.aiWallet,
                    isAI: true,
                    rating: 1000
                });
                await aiPlayer.save();
            }
        } catch (error) {
            console.error('Error initializing AI player:', error);
        }
    }

    async getOrCreatePlayer(walletAddress) {
        try {
            let player = await Player.findOne({ walletAddress });
            if (!player) {
                player = new Player({ walletAddress });
                await player.save();
            }
            // Check for rating decay
            await player.handleRatingDecay();
            return player;
        } catch (error) {
            console.error('Error getting/creating player:', error);
            throw error;
        }
    }

    calculateEloRating(playerRating, opponentRating, playerWon) {
        const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
        const actualScore = playerWon ? 1 : 0;
        return Math.round(playerRating + this.K_FACTOR * (actualScore - expectedScore));
    }

    async recordGame(playerWallet, playerScore, aiScore, duration) {
        try {
            const player = await this.getOrCreatePlayer(playerWallet);
            const ai = await Player.findOne({ isAI: true });
            
            const playerWon = playerScore > aiScore;
            
            // Record ratings before update
            const playerRatingBefore = player.rating;
            const aiRatingBefore = ai.rating;
            
            // Calculate new ELO ratings
            const newPlayerRating = this.calculateEloRating(playerRatingBefore, aiRatingBefore, playerWon);
            const newAiRating = this.calculateEloRating(aiRatingBefore, playerRatingBefore, !playerWon);
            
            // Update ratings
            player.rating = newPlayerRating;
            ai.rating = newAiRating;
            
            // Update player stats
            await player.updateStats(playerWon, playerScore, duration);
            await ai.updateStats(!playerWon, aiScore, duration);
            
            // Create game record
            const game = new Game({
                playerWallet,
                playerScore,
                aiScore,
                playerRatingBefore,
                playerRatingAfter: newPlayerRating,
                aiRatingBefore,
                aiRatingAfter: newAiRating,
                playerWon,
                duration
            });
            
            await game.save();
            
            // Broadcast updates
            this.broadcastUpdate('gameCompleted', {
                player: player.toObject({ virtuals: true }),
                ai: ai.toObject({ virtuals: true }),
                game: game.toObject()
            });
            
            // Update leaderboard
            const leaderboard = await this.getLeaderboard();
            this.broadcastUpdate('leaderboardUpdate', leaderboard);
            
            return {
                player: player.toObject({ virtuals: true }),
                ai: ai.toObject({ virtuals: true }),
                game: game.toObject()
            };
        } catch (error) {
            console.error('Error recording game:', error);
            throw error;
        }
    }

    async getLeaderboard(limit = 10) {
        try {
            const players = await Player.find()
                .sort({ rating: -1 })
                .limit(limit)
                .lean({ virtuals: true });
            
            // Add rank information
            const rankedPlayers = players.map((player, index) => ({
                ...player,
                leaderboardRank: index + 1
            }));
            
            return rankedPlayers;
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            throw error;
        }
    }

    async getPlayerStats(walletAddress) {
        try {
            const player = await Player.findOne({ walletAddress })
                .lean({ virtuals: true });
            
            if (!player) return null;
            
            const recentGames = await Game.find({ playerWallet: walletAddress })
                .sort({ timestamp: -1 })
                .limit(10)
                .lean();
            
            // Calculate additional statistics
            const totalGames = await Game.countDocuments({ playerWallet: walletAddress });
            const rankedPosition = await Player.countDocuments({ rating: { $gt: player.rating } }) + 1;
            
            return {
                player,
                recentGames,
                stats: {
                    totalGames,
                    rankedPosition,
                    percentile: ((totalGames - rankedPosition) / totalGames * 100).toFixed(2)
                }
            };
        } catch (error) {
            console.error('Error getting player stats:', error);
            throw error;
        }
    }

    async resetLeaderboard() {
        try {
            console.log('Starting global leaderboard reset...');
            
            // Reset all player stats
            await Player.updateMany(
                { isAI: false },
                { 
                    $set: {
                        rating: 1000,
                        wins: 0,
                        losses: 0,
                        gamesPlayed: 0,
                        winStreak: 0,
                        highestWinStreak: 0,
                        lastGamePlayed: new Date(),
                        totalScore: 0,
                        highestScore: 0,
                        averageScore: 0,
                        totalGameDuration: 0,
                        averageGameDuration: 0,
                        rank: 'Bronze'
                    }
                }
            );
            
            // Reset AI player stats
            await Player.updateOne(
                { isAI: true },
                { 
                    $set: {
                        rating: 1000,
                        wins: 0,
                        losses: 0,
                        gamesPlayed: 0,
                        winStreak: 0,
                        highestWinStreak: 0,
                        lastGamePlayed: new Date(),
                        totalScore: 0,
                        highestScore: 0,
                        averageScore: 0,
                        totalGameDuration: 0,
                        averageGameDuration: 0,
                        rank: 'Bronze'
                    }
                }
            );
            
            // Broadcast reset
            this.broadcastUpdate('leaderboardReset', await this.getLeaderboard());
            
            console.log('Leaderboard reset complete');
        } catch (error) {
            console.error('Error resetting leaderboard:', error);
            throw error;
        }
    }

    async updateAIDifficulty(difficulty) {
        try {
            console.log('Updating AI difficulty to:', difficulty);
            
            const difficultySettings = {
                medium: {
                    speed: 7,
                    reactionDelay: 0.15,
                    predictionError: 20
                },
                hard: {
                    speed: 8,
                    reactionDelay: 0.1,
                    predictionError: 15
                },
                harder: {
                    speed: 9,
                    reactionDelay: 0.05,
                    predictionError: 10
                },
                extreme: {
                    speed: 10,
                    reactionDelay: 0.02,
                    predictionError: 5
                }
            };

            const settings = difficultySettings[difficulty.toLowerCase()];
            if (!settings) {
                throw new Error('Invalid difficulty level');
            }

            const ai = await Player.findOne({ isAI: true });
            if (!ai) {
                throw new Error('AI player not found');
            }

            ai.aiDifficulty = difficulty.toLowerCase();
            ai.aiSettings = settings;
            await ai.save();

            console.log('AI difficulty updated successfully');
            return {
                difficulty: ai.aiDifficulty,
                settings: ai.aiSettings
            };
        } catch (error) {
            console.error('Error updating AI difficulty:', error);
            throw error;
        }
    }

    async getAISettings() {
        try {
            const ai = await Player.findOne({ isAI: true });
            if (!ai) {
                throw new Error('AI player not found');
            }
            return {
                difficulty: ai.aiDifficulty,
                settings: ai.aiSettings
            };
        } catch (error) {
            console.error('Error getting AI settings:', error);
            throw error;
        }
    }

    async resetAllData() {
        try {
            console.log('Resetting all database data...');
            
            // Reset Player collection
            await Player.updateMany(
                {},
                {
                    $set: {
                        rating: 1000,
                        wins: 0,
                        losses: 0,
                        gamesPlayed: 0,
                        winStreak: 0,
                        lastGameTime: null
                    }
                }
            );

            // Delete all games
            await Game.deleteMany({});

            // Reset AI player specifically
            await Player.findOneAndUpdate(
                { isAI: true },
                {
                    $set: {
                        rating: 1000,
                        wins: 0,
                        losses: 0,
                        gamesPlayed: 0,
                        winStreak: 0,
                        lastGameTime: null
                    }
                },
                { upsert: true }
            );

            console.log('Database reset completed successfully');
            return { success: true, message: 'All data has been reset successfully' };
        } catch (error) {
            console.error('Error resetting database:', error);
            throw error;
        }
    }
}

module.exports = new DatabaseService();
