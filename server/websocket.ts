import { WebSocket, WebSocketServer } from "ws";
import { type Server } from "http";
import { log } from "./vite";

interface Client {
  id: number;
  ws: WebSocket;
}

class NotificationServer {
  private wss: WebSocketServer;
  private clients: Map<number, Client>;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: "/ws/notifications",  // Dedicated path for notifications
      clientTracking: true, // Enable built-in client tracking
      perMessageDeflate: false // Disable perMessageDeflate for better reliability
    });
    this.clients = new Map();

    this.wss.on("connection", (ws, req) => {
      log(`New WebSocket connection from ${req.headers.origin}`);
      let clientId = Math.random();

      ws.on("message", (message) => this.handleMessage(ws, message, clientId));
      ws.on("close", () => this.handleClose(ws, clientId));
      ws.on("error", (error) => {
        log(`WebSocket error for client ${clientId}: ${error.message}`);
        this.handleClose(ws, clientId);
        ws.terminate(); // Force close the connection on error
      });

      // Implement ping/pong to detect stale connections
      const pingInterval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
          ws.ping();
        }
      }, 30000);

      ws.on('close', () => {
        clearInterval(pingInterval);
        this.handleClose(ws, clientId);
      });
    });

    log("WebSocket server initialized");
  }

  private handleMessage(ws: WebSocket, message: Buffer | ArrayBuffer | Buffer[], clientId: number) {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === "register") {
        const userId = data.userId;
        this.clients.set(userId, { id: userId, ws });
        log(`Client registered: ${userId}`);
      }
    } catch (error) {
      log(`Invalid message from client ${clientId}: ${error}`);
    }
  }

  private handleClose(ws: WebSocket, clientId: number) {
    // Iterate over a copy of the keys to avoid issues with modifying the map during iteration
    for (const userId of Array.from(this.clients.keys())) {
      const client = this.clients.get(userId);
      if (client && client.ws === ws) {
        this.clients.delete(userId);
        log(`Client disconnected: ${userId}`);
        break; //Found and removed, exit loop
      }
    }
  }

  public sendNotification(userId: number, notification: { type: string; message: string; data?: any }) {
    const client = this.clients.get(userId);
    if (client) {
      try {
        client.ws.send(JSON.stringify(notification));
        log(`Notification sent to ${userId}: ${notification.type}`);
      } catch (error) {
        log(`Error sending notification to ${userId}: ${error}`);
      }
    }
  }

  public broadcastNotification(notification: { type: string; message: string; data?: any }) {
    this.clients.forEach((client) => {
      try {
        client.ws.send(JSON.stringify(notification));
      } catch (error) {
        log(`Error sending broadcast notification: ${error}`);
      }
    });
    log(`Broadcast notification: ${notification.type}`);
  }
}

export function createNotificationServer(server: Server): NotificationServer {
  return new NotificationServer(server);
}