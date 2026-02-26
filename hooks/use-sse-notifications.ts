import { useEffect, useRef } from "react";
import { useNotificationStore, type NotificationItem } from "@/store/notification-store";

export function useSSENotifications(isAuthenticated: boolean) {
  const addNotification = useNotificationStore((s) => s.addNotification);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      return;
    }

    const eventSource = new EventSource("/api/notifications/stream");
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "NEW_NOTIFICATION") {
          const notification: NotificationItem = {
            ...data.payload,
            isRead: false,
          };
          addNotification(notification);
        }
      } catch {
        // Ignore parse errors (heartbeats, etc.)
      }
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [isAuthenticated, addNotification]);
}
