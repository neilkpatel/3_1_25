import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  type: string;
  message: string;
  data?: any;
}

interface NotificationContextType {
  connect: (userId: number) => void;
  disconnect: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const { toast } = useToast();

  const connect = useCallback((userId: number) => {
    // Don't create a new connection if one already exists
    if (socket?.readyState === WebSocket.OPEN) {
      return;
    }

    // Close existing socket if it's in a different state
    if (socket) {
      socket.close();
    }

    // Use proper WebSocket URL construction
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/notifications`);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "register", userId }));
    };

    ws.onmessage = (event) => {
      try {
        const notification: Notification = JSON.parse(event.data);

        toast({
          title: notification.type,
          description: notification.message,
        });

      } catch (error) {
        console.error("Invalid notification:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to connect to notification service",
      });
    };

    setSocket(ws);
  }, [toast]); // Only recreate when toast changes

  const disconnect = useCallback(() => {
    if (socket) {
      socket.close();
      setSocket(null);
    }
  }, [socket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return (
    <NotificationContext.Provider value={{ connect, disconnect }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}