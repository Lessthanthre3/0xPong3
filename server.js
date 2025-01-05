const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const http = require('http');
const setupWebSocketServer = require('./websocket-server');
const dbService = require('./services/DatabaseService');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

// Setup WebSocket
const wss = setupWebSocketServer(server);

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

// Stats endpoints
app.get('/api/stats/ai', async (req, res) => {
    try {
        const aiStats = await dbService.getAIStats();
        res.json(aiStats);
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

// Leaderboard endpoints
app.get('/api/leaderboard', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const leaderboard = await dbService.getLeaderboard(limit);
        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve the main application
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// Export for AWS deployment
module.exports = { app, server };
