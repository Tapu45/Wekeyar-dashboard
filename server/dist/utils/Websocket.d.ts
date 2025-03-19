import { WebSocketServer } from 'ws';
import http from 'http';
export declare function initializeWebSocketServer(server: http.Server): WebSocketServer;
export declare function broadcastProgress(progress: number): void;
export declare function broadcastCompletion(status: 'completed' | 'error', stats?: any, error?: string): void;
declare const _default: {
    readonly clients: Set<unknown>;
    broadcastProgress: typeof broadcastProgress;
    broadcastCompletion: typeof broadcastCompletion;
};
export default _default;
