const Player = require('../models/Player');
const Game = require('../models/Game');

class DatabaseService {
    constructor() {
        this.aiWallet = 'AI_PLAYER_ADDRESS';
        this.initializeAI();
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
            return player;
        } catch (error) {
            console.error('Error getting/creating player:', error);
            throw error;
        }
    }

    async recordGame(playerWallet, playerScore, aiScore, duration) {
        try {
            const player = await this.getOrCreatePlayer(playerWallet);
            const ai = await Player.findOne({ isAI: true });
            
            const playerWon = playerScore > aiScore;
            
            // Record ratings before update
            const playerRatingBefore = player.rating;
            const aiRatingBefore = ai.rating;
            
            // Update player stats
            await player.updateStats(playerWon);
            await ai.updateStats(!playerWon);
            
            // Create game record
            const game = new Game({
                playerWallet,
                playerScore,
                aiScore,
                playerRatingBefore,
                playerRatingAfter: player.rating,
                aiRatingBefore,
                aiRatingAfter: ai.rating,
                playerWon,
                duration
            });
            
            await game.save();
            
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
            
            return players;
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
                .limit(5)
                .lean();
            
            return {
                player,
                recentGames
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
                        lastGamePlayed: new Date()
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
                        lastGamePlayed: new Date()
                    }
                }
            );

            // Clear all game history
            await Game.deleteMany({});
            
            console.log('Global leaderboard reset completed successfully');
            return true;
        } catch (error) {
            console.error('Error during global leaderboard reset:', error);
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
