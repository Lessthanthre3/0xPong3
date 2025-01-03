const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    playerWallet: {
        type: String,
        required: true,
        index: true
    },
    playerScore: {
        type: Number,
        required: true
    },
    aiScore: {
        type: Number,
        required: true
    },
    playerRatingBefore: Number,
    playerRatingAfter: Number,
    aiRatingBefore: Number,
    aiRatingAfter: Number,
    playerWon: Boolean,
    duration: Number, // in seconds
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const Game = mongoose.model('Game', gameSchema);
module.exports = Game;
