import { create } from "zustand";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  createdAt: string;
  isRead: boolean;
};

type NotificationStore = {
  notifications: NotificationItem[];
  _hydrated: boolean;
  _isAuthenticated: boolean;

  setAuthenticated: (value: boolean) => void;
  setNotifications: (notifications: NotificationItem[]) => void;
  addNotification: (notification: NotificationItem) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: () => number;
};

export const useNotificationStore = create<NotificationStore>()((set, get) => ({
  notifications: [],
  _hydrated: false,
  _isAuthenticated: false,

  setAuthenticated: (value) => set({ _isAuthenticated: value }),

  setNotifications: (notifications) =>
    set({ notifications, _hydrated: true }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 50),
    })),

  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
    })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    })),

  unreadCount: () => get().notifications.filter((n) => !n.isRead).length,
}));
