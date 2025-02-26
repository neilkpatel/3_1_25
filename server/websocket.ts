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

    this.wss.on("connection", (ws) => {
      log("New WebSocket connection established");
      ws.on("message", (message) => this.handleMessage(ws, message));
      ws.on("close", () => this.handleClose(ws));
      ws.on("error", (error) => {
        log(`WebSocket error: ${error.message}`);
      });
    });

    log("WebSocket server initialized");
  }

  private handleMessage(ws: WebSocket, message: Buffer | ArrayBuffer | Buffer[]) {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === "register") {
        const userId = data.userId;
        this.clients.set(userId, { id: userId, ws });
        log(`Client registered: ${userId}`);
      }
    } catch (error) {
      log(`Invalid message: ${error}`);
    }
  }

  private handleClose(ws: WebSocket) {
    // Iterate over a copy of the keys to avoid issues with modifying the map during iteration
    for (const userId of Array.from(this.clients.keys())) {
      const client = this.clients.get(userId);
      if (client && client.ws === ws) {
        this.clients.delete(userId);
        log(`Client disconnected: ${userId}`);
      }
    }
  }

  public sendNotification(userId: number, notification: { type: string; message: string; data?: any }) {
    const client = this.clients.get(userId);
    if (client) {
      client.ws.send(JSON.stringify(notification));
      log(`Notification sent to ${userId}: ${notification.type}`);
    }
  }

  public broadcastNotification(notification: { type: string; message: string; data?: any }) {
    this.clients.forEach((client) => {
      client.ws.send(JSON.stringify(notification));
    });
    log(`Broadcast notification: ${notification.type}`);
  }
}

export function createNotificationServer(server: Server): NotificationServer {
  return new NotificationServer(server);
}