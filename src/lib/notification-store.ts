import { create } from 'zustand';

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export type NotificationSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type NotificationType = 'THREAT' | 'COMPLIANCE' | 'VENDOR' | 'INCIDENT' | 'SYSTEM' | 'AI_INSIGHT';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    severity: NotificationSeverity;
    read: boolean;
    timestamp: number;
    actionUrl?: string;
}

export interface AlertRule {
    id: string;
    name: string;
    condition: string;
    threshold: number;
    enabled: boolean;
    notificationType: NotificationType;
}

const API = '/api/notifications';

interface NotificationStore {
    notifications: Notification[];
    alertRules: AlertRule[];
    isLoading: boolean;
    hasFetched: boolean;
    fetchNotifications: () => Promise<void>;
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => Promise<void>;
    markRead: (id: string) => Promise<void>;
    markAllRead: () => Promise<void>;
    clearAll: () => Promise<void>;
    removeNotification: (id: string) => Promise<void>;
    getUnreadCount: () => number;
    toggleAlertRule: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>()((set, get) => ({
    notifications: [],
    alertRules: [],
    isLoading: false,
    hasFetched: false,

    fetchNotifications: async () => {
        if (get().hasFetched) return;
        set({ isLoading: true });
        try {
            const res = await fetch(API);
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            set({
                notifications: data.notifications ?? [],
                alertRules: data.alertRules ?? [],
                hasFetched: true,
                isLoading: false,
            });
        } catch (e) {
            console.warn('Notifications fetch failed', e);
            set({ hasFetched: true, isLoading: false });
        }
    },

    addNotification: async (notification) => {
        try {
            const res = await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notification: {
                        ...notification,
                        timestamp: Date.now(),
                    },
                }),
            });
            if (!res.ok) throw new Error(await res.text());
            const created = await res.json();
            set((s) => ({
                notifications: [created, ...s.notifications].slice(0, 100),
                hasFetched: true,
            }));
        } catch (e) {
            console.warn('Notification add failed', e);
        }
    },

    markRead: async (id) => {
        try {
            await fetch(`${API}/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ read: true }),
            });
            set((s) => ({
                notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
            }));
        } catch (e) {
            console.warn('Notification markRead failed', e);
        }
    },

    markAllRead: async () => {
        try {
            await fetch(API, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markAllRead: true }),
            });
            set((s) => ({
                notifications: s.notifications.map((n) => ({ ...n, read: true })),
            }));
        } catch (e) {
            console.warn('Notifications markAllRead failed', e);
        }
    },

    clearAll: async () => {
        try {
            await fetch(API, { method: 'DELETE' });
            set({ notifications: [] });
        } catch (e) {
            console.warn('Notifications clearAll failed', e);
        }
    },

    removeNotification: async (id) => {
        try {
            await fetch(`${API}/${id}`, { method: 'DELETE' });
            set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }));
        } catch (e) {
            console.warn('Notification remove failed', e);
        }
    },

    getUnreadCount: () => get().notifications.filter((n) => !n.read).length,

    toggleAlertRule: async (id) => {
        const rule = get().alertRules.find((r) => r.id === id);
        if (!rule) return;
        const enabled = !rule.enabled;
        try {
            await fetch(`${API}/alert-rules/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled }),
            });
            set((s) => ({
                alertRules: s.alertRules.map((r) => (r.id === id ? { ...r, enabled } : r)),
            }));
        } catch (e) {
            console.warn('AlertRule toggle failed', e);
        }
    },
}));
