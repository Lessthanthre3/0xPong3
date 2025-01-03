const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dbService = require('./services/DatabaseService');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB Atlas');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Game endpoints
app.post('/api/game/record', async (req, res) => {
    try {
        const { playerWallet, playerScore, aiScore, duration } = req.body;
        const result = await dbService.recordGame(playerWallet, playerScore, aiScore, duration);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/leaderboard', async (req, res) => {
    try {
        const leaderboard = await dbService.getLeaderboard();
        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/stats/:wallet', async (req, res) => {
    try {
        const stats = await dbService.getPlayerStats(req.params.wallet);
        if (!stats) {
            return res.status(404).json({ error: 'Player not found' });
        }
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/reset-leaderboard', async (req, res) => {
    try {
        await dbService.resetLeaderboard();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/reset-all-data', async (req, res) => {
    try {
        const { adminWallet } = req.body;
        
        // Verify admin wallet
        if (!adminWallet || adminWallet !== 'GrDWUZZpCsxXR8qnZXREmE3bDgkQxLG6BHve3NLPbHFR') {
            return res.status(403).json({ error: 'Unauthorized access' });
        }

        const result = await dbService.resetAllData();
        res.json(result);
    } catch (error) {
        console.error('Error in reset endpoint:', error);
        res.status(500).json({ error: 'Failed to reset data' });
    }
});

// AI difficulty endpoints
app.post('/api/admin/difficulty', async (req, res) => {
    try {
        const { difficulty } = req.body;
        const result = await dbService.updateAIDifficulty(difficulty);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/ai/settings', async (req, res) => {
    try {
        const settings = await dbService.getAISettings();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
