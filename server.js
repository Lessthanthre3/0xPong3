const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dbService = require('./services/DatabaseService');
require('dotenv').config();
const http = require('http');
const socketIO = require('socket.io');

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
        
        // Fetch updated stats and emit to all clients
        const aiStats = await dbService.getAIStats();
        const leaderboard = await dbService.getLeaderboard();
        io.emit('statsUpdate', { aiStats, leaderboard });
        
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

// WebSocket connection handling
const server = http.createServer(app);
const io = socketIO(server);
const activePlayers = new Map();

io.on('connection', async (socket) => {
    console.log('New client connected');
    
    try {
        // Send initial stats to newly connected client
        const aiStats = await dbService.getAIStats();
        const leaderboard = await dbService.getLeaderboard();
        socket.emit('statsUpdate', { aiStats, leaderboard });
    } catch (error) {
        console.error('Error fetching initial stats:', error);
    }
    
    // Player registration
    socket.on('register', async (data) => {
        const { walletAddress } = data;
        activePlayers.set(walletAddress, socket);
        socket.walletAddress = walletAddress;
        
        // Send player's personal stats
        try {
            const playerStats = await dbService.getPlayerStats(walletAddress);
            socket.emit('playerStatsUpdate', playerStats);
        } catch (error) {
            console.error('Error fetching player stats:', error);
        }
        
        // Broadcast updated active players list
        io.emit('activePlayers', Array.from(activePlayers.keys()));
    });
});

// Start server
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
