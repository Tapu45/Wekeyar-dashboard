"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeWebSocketServer = initializeWebSocketServer;
exports.broadcastProgress = broadcastProgress;
exports.broadcastCompletion = broadcastCompletion;
const ws_1 = require("ws");
let wss;
function initializeWebSocketServer(server) {
    wss = new ws_1.WebSocketServer({ server });
    wss.on('connection', (ws) => {
        console.log('Client connected to WebSocket');
        ws.on('close', () => {
            console.log('Client disconnected from WebSocket');
        });
        ws.send(JSON.stringify({ type: 'connection', status: 'connected' }));
    });
    console.log('WebSocket server initialized');
    return wss;
}
function broadcastProgress(progress) {
    if (wss) {
        console.log(`Broadcasting progress: ${progress}%`);
        const message = JSON.stringify({ progress });
        wss.clients.forEach(client => {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
}
function broadcastCompletion(status, stats, error) {
    if (wss) {
        const message = JSON.stringify({
            progress: 100,
            status,
            stats: stats || {},
            error: error || null
        });
        wss.clients.forEach(client => {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
}
exports.default = {
    get clients() {
        return wss ? wss.clients : new Set();
    },
    broadcastProgress,
    broadcastCompletion
};
//# sourceMappingURL=Websocket.js.map