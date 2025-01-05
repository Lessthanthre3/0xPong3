const WebSocket = require('ws');
const dbService = require('./services/DatabaseService');

function setupWebSocketServer(server) {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        console.log('New WebSocket connection');

        // Add subscriber for real-time updates
        dbService.addSubscriber(ws);

        // Send initial leaderboard
        dbService.getLeaderboard().then(leaderboard => {
            ws.send(JSON.stringify({
                type: 'leaderboardUpdate',
                data: leaderboard
            }));
        });

        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);
                
                switch (data.type) {
                    case 'getPlayerStats':
                        const stats = await dbService.getPlayerStats(data.walletAddress);
                        ws.send(JSON.stringify({
                            type: 'playerStats',
                            data: stats
                        }));
                        break;
                    
                    case 'getLeaderboard':
                        const leaderboard = await dbService.getLeaderboard(data.limit);
                        ws.send(JSON.stringify({
                            type: 'leaderboardUpdate',
                            data: leaderboard
                        }));
                        break;
                }
            } catch (error) {
                console.error('WebSocket message error:', error);
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Invalid message format'
                }));
            }
        });

        ws.on('close', () => {
            console.log('Client disconnected');
            dbService.removeSubscriber(ws);
        });
    });

    return wss;
}

module.exports = setupWebSocketServer;
