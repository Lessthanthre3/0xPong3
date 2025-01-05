require('dotenv').config();
const mongoose = require('mongoose');
const Player = require('../models/Player');
const Game = require('../models/Game');

async function resetAllScores() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB successfully');

        // Delete all non-AI players
        console.log('Removing all non-AI players...');
        await Player.deleteMany({ isAI: { $ne: true } });
        console.log('All non-AI players removed');

        // Delete all games
        console.log('Deleting all game history...');
        await Game.deleteMany({});
        console.log('Game history cleared');

        // Reset AI player completely
        console.log('Resetting AI player...');
        await Player.findOneAndUpdate(
            { isAI: true },
            {
                $set: {
                    rating: 1000,
                    wins: 0,
                    losses: 0,
                    gamesPlayed: 0,
                    winStreak: 0,
                    lastGameTime: null,
                    aiDifficulty: 'medium',
                    aiSettings: {
                        speed: 7,
                        reactionDelay: 0.15,
                        predictionError: 20
                    }
                }
            },
            { upsert: true }
        );
        console.log('AI player reset');

        // Verify the reset
        const aiPlayer = await Player.findOne({ isAI: true });
        console.log('AI player state:', aiPlayer);
        
        const playerCount = await Player.countDocuments();
        console.log(`Total players in database: ${playerCount}`);
        
        const gameCount = await Game.countDocuments();
        console.log(`Total games in database: ${gameCount}`);

        console.log('Database reset completed successfully');
    } catch (error) {
        console.error('Error resetting database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

resetAllScores();
