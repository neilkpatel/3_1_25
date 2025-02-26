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
  registerPushNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const { toast } = useToast();

  const registerPushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
      });

      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });

      toast({
        title: "Push Notifications Enabled",
        description: "You'll now receive notifications even when not in the app",
      });
    } catch (err) {
      console.error('Failed to register push notifications:', err);
      toast({
        variant: "destructive",
        title: "Push Notification Error",
        description: "Failed to enable push notifications",
      });
    }
  };

  const connect = useCallback((userId: number) => {
    // Don't create a new connection if one already exists
    if (socket?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    // Close existing socket if it's in a different state
    if (socket) {
      console.log('Closing existing WebSocket connection');
      socket.close();
    }

    // Use proper WebSocket URL construction
    // In production, use relative path which will use the same host
    // In development, connect to the Express server port
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NODE_ENV === 'production' 
      ? window.location.host
      : `${window.location.hostname}:5000`;
    const wsUrl = `${protocol}//${host}/ws/notifications`;
    console.log('Connecting to WebSocket:', wsUrl);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connection established');
      ws.send(JSON.stringify({ type: "register", userId }));
    };

    ws.onmessage = (event) => {
      try {
        const notification: Notification = JSON.parse(event.data);
        console.log('Received notification:', notification);

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
      // Log the full error details
      console.error('WebSocket error details:', {
        url: wsUrl,
        readyState: ws.readyState,
        error
      });

      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to connect to notification service. Retrying...",
      });

      // Attempt to reconnect after a delay
      setTimeout(() => {
        console.log('Attempting to reconnect...');
        connect(userId);
      }, 5000);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setSocket(null);
    };

    setSocket(ws);
  }, [toast]); // Only recreate when toast changes

  const disconnect = useCallback(() => {
    if (socket) {
      console.log('Disconnecting WebSocket');
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
    <NotificationContext.Provider value={{ connect, disconnect, registerPushNotifications }}>
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