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
    },
    averageScore: {
        type: Number,
        default: 0
    },
    highestScore: {
        type: Number,
        default: 0
    },
    totalScore: {
        type: Number,
        default: 0
    },
    averageGameDuration: {
        type: Number,
        default: 0
    },
    totalGameDuration: {
        type: Number,
        default: 0
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    rank: {
        type: String,
        enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master'],
        default: 'Bronze'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for win rate
playerSchema.virtual('winRate').get(function() {
    if (this.gamesPlayed === 0) return 0;
    return ((this.wins / this.gamesPlayed) * 100).toFixed(2);
});

// Virtual for average score per game
playerSchema.virtual('avgScorePerGame').get(function() {
    if (this.gamesPlayed === 0) return 0;
    return (this.totalScore / this.gamesPlayed).toFixed(2);
});

// Method to update stats after a game
playerSchema.methods.updateStats = async function(won, score, duration) {
    this.gamesPlayed++;
    
    if (won) {
        this.wins++;
        this.winStreak++;
        if (this.winStreak > this.highestWinStreak) {
            this.highestWinStreak = this.winStreak;
        }
    } else {
        this.losses++;
        this.winStreak = 0;
    }

    // Update score statistics
    this.totalScore += score;
    this.averageScore = this.totalScore / this.gamesPlayed;
    if (score > this.highestScore) {
        this.highestScore = score;
    }

    // Update duration statistics
    this.totalGameDuration += duration;
    this.averageGameDuration = this.totalGameDuration / this.gamesPlayed;

    // Update rating (ELO calculation in DatabaseService)
    this.lastGamePlayed = new Date();
    this.lastActive = new Date();

    // Update rank based on rating
    this.rank = this.calculateRank();

    await this.save();
};

// Calculate rank based on rating
playerSchema.methods.calculateRank = function() {
    if (this.rating < 1100) return 'Bronze';
    if (this.rating < 1300) return 'Silver';
    if (this.rating < 1500) return 'Gold';
    if (this.rating < 1700) return 'Platinum';
    if (this.rating < 2000) return 'Diamond';
    return 'Master';
};

// Method to handle rating decay for inactive players
playerSchema.methods.handleRatingDecay = async function() {
    const DECAY_DAYS = 7; // Start decay after 7 days of inactivity
    const MAX_DECAY = 100; // Maximum rating points that can be lost to decay
    const DAILY_DECAY = 5; // Points lost per day after decay starts

    const daysSinceLastGame = Math.floor((Date.now() - this.lastGamePlayed) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastGame > DECAY_DAYS) {
        const decayDays = daysSinceLastGame - DECAY_DAYS;
        const decayAmount = Math.min(decayDays * DAILY_DECAY, MAX_DECAY);
        
        if (this.rating > 1000) { // Don't decay below 1000
            this.rating = Math.max(1000, this.rating - decayAmount);
            await this.save();
        }
    }
};

const Player = mongoose.model('Player', playerSchema);
module.exports = Player;
