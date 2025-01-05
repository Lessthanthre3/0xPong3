class WebSocketClient {
    constructor() {
        this.connect();
        this.subscribers = new Map();
    }

    connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('WebSocket connected');
        };

        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            // Notify all subscribers of this message type
            const subscribers = this.subscribers.get(message.type) || [];
            subscribers.forEach(callback => callback(message.data));
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected. Reconnecting...');
            setTimeout(() => this.connect(), 1000);
        };
    }

    subscribe(type, callback) {
        if (!this.subscribers.has(type)) {
            this.subscribers.set(type, []);
        }
        this.subscribers.get(type).push(callback);
    }

    send(type, data) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, data }));
        }
    }
}

// Initialize WebSocket client when window loads
window.addEventListener('load', () => {
    window.wsClient = new WebSocketClient();
});
