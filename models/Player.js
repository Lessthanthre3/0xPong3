const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    isAI: {
        type: Boolean,
        default: false
    },
    aiDifficulty: {
        type: String,
        enum: ['medium', 'hard', 'harder', 'extreme'],
        default: 'medium'
    },
    aiSettings: {
        speed: {
            type: Number,
            default: 7
        },
        reactionDelay: {
            type: Number,
            default: 0.15
        },
        predictionError: {
            type: Number,
            default: 20
        }
    },
    rating: {
        type: Number,
        default: 1000
    },
    wins: {
        type: Number,
        default: 0
    },
    losses: {
        type: Number,
        default: 0
    },
    gamesPlayed: {
        type: Number,
        default: 0
    },
    winStreak: {
        type: Number,
        default: 0
    },
    highestWinStreak: {
        type: Number,
        default: 0
    },
    lastGamePlayed: {
        type: Date,
        default: Date.now
    }
});

// Virtual field for win rate
playerSchema.virtual('winRate').get(function() {
    if (this.gamesPlayed === 0) return 0;
    return (this.wins / this.gamesPlayed) * 100;
});

// Method to update stats after a game
playerSchema.methods.updateStats = async function(won) {
    this.gamesPlayed++;
    if (won) {
        this.wins++;
        this.winStreak++;
        this.rating += 3;
        if (this.winStreak > this.highestWinStreak) {
            this.highestWinStreak = this.winStreak;
        }
    } else {
        this.losses++;
        this.winStreak = 0;
        this.rating = Math.max(0, this.rating - 1.5);
    }
    this.lastGamePlayed = new Date();
    await this.save();
};

const Player = mongoose.model('Player', playerSchema);
module.exports = Player;
