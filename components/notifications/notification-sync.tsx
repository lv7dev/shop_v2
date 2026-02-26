"use client";

import { useEffect, useRef } from "react";
import { useNotificationStore } from "@/store/notification-store";
import { useSSENotifications } from "@/hooks/use-sse-notifications";
import { getNotifications } from "@/actions/notification";

type NotificationSyncProps = {
  isAuthenticated: boolean;
};

export function NotificationSync({ isAuthenticated }: NotificationSyncProps) {
  const setAuthenticated = useNotificationStore((s) => s.setAuthenticated);
  const setNotifications = useNotificationStore((s) => s.setNotifications);
  const loadedRef = useRef(false);

  useSSENotifications(isAuthenticated);

  useEffect(() => {
    setAuthenticated(isAuthenticated);
  }, [isAuthenticated, setAuthenticated]);

  useEffect(() => {
    if (loadedRef.current || !isAuthenticated) return;
    loadedRef.current = true;

    getNotifications().then((result) => {
      if (result.success) {
        setNotifications(result.notifications);
      }
    });
  }, [isAuthenticated, setNotifications]);

  return null;
}
