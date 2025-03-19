// src/utils/Websocket.ts
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

// Create WebSocket server
let wss: WebSocketServer;

export function initializeWebSocketServer(server: http.Server) {
  wss = new WebSocketServer({ server });
  
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({ type: 'connection', status: 'connected' }));
  });
  
  console.log('WebSocket server initialized');
  return wss;
}

// Function to broadcast progress updates to all connected clients
export function broadcastProgress(progress: number) {
  if (wss) {
    console.log(`Broadcasting progress: ${progress}%`); // Debug log
    const message = JSON.stringify({ progress });
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

// Function to broadcast completion status
export function broadcastCompletion(status: 'completed' | 'error', stats?: any, error?: string) {
  if (wss) {
    const message = JSON.stringify({ 
      progress: 100,
      status,
      stats: stats || {},
      error: error || null
    });
    
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

// Export the WebSocket server instance and broadcast functions
export default { 
  get clients() { 
    return wss ? wss.clients : new Set(); 
  },
  broadcastProgress,
  broadcastCompletion
};