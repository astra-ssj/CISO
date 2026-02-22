import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

// ────────────────────────────────────────────
// Store
// ────────────────────────────────────────────

interface NotificationStore {
    notifications: Notification[];
    alertRules: AlertRule[];
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
    markRead: (id: string) => void;
    markAllRead: () => void;
    clearAll: () => void;
    removeNotification: (id: string) => void;
    getUnreadCount: () => number;
    toggleAlertRule: (id: string) => void;
}

const DEMO_NOTIFICATIONS: Notification[] = [
    {
        id: 'n-001', type: 'THREAT', title: 'Critical CVE Detected',
        message: 'CVE-2026-1234 found in express@4.18.2 — Remote Code Execution. CVSS 9.8.',
        severity: 'CRITICAL', read: false, timestamp: Date.now() - 300000, actionUrl: '/appsec'
    },
    {
        id: 'n-002', type: 'COMPLIANCE', title: 'NIST CSF Compliance Dropped',
        message: 'Overall compliance score dropped below 70% threshold. 3 new non-compliant controls detected.',
        severity: 'HIGH', read: false, timestamp: Date.now() - 1800000, actionUrl: '/governance'
    },
    {
        id: 'n-003', type: 'VENDOR', title: 'Vendor Contract Expiring',
        message: 'DataFlow Analytics contract expires in 30 days. Assessment overdue — risk score: 68/100.',
        severity: 'MEDIUM', read: false, timestamp: Date.now() - 3600000, actionUrl: '/vendors'
    },
    {
        id: 'n-004', type: 'INCIDENT', title: 'New Incident Declared',
        message: 'Suspicious login activity detected from unexpected geography. IR playbook triggered.',
        severity: 'HIGH', read: true, timestamp: Date.now() - 7200000, actionUrl: '/incidents'
    },
    {
        id: 'n-005', type: 'AI_INSIGHT', title: 'AI Policy Recommendation',
        message: 'Astra identified 3 gaps in your Data Protection Policy against GDPR Article 32.',
        severity: 'INFO', read: true, timestamp: Date.now() - 14400000, actionUrl: '/policies'
    },
];

const DEFAULT_ALERT_RULES: AlertRule[] = [
    { id: 'ar-001', name: 'Critical CVE Alert', condition: 'cvss_score > threshold', threshold: 9.0, enabled: true, notificationType: 'THREAT' },
    { id: 'ar-002', name: 'Compliance Score Drop', condition: 'compliance_score < threshold', threshold: 70, enabled: true, notificationType: 'COMPLIANCE' },
    { id: 'ar-003', name: 'Vendor Risk Escalation', condition: 'vendor_risk_score > threshold', threshold: 75, enabled: true, notificationType: 'VENDOR' },
    { id: 'ar-004', name: 'Incident Declared', condition: 'incident_created', threshold: 0, enabled: true, notificationType: 'INCIDENT' },
];

export const useNotificationStore = create<NotificationStore>()(
    persist(
        (set, get) => ({
            notifications: DEMO_NOTIFICATIONS,
            alertRules: DEFAULT_ALERT_RULES,

            addNotification: (notification) => set((state) => ({
                notifications: [{
                    ...notification,
                    id: `n-${Date.now()}`,
                    timestamp: Date.now(),
                    read: false
                }, ...state.notifications].slice(0, 100) // Keep max 100
            })),

            markRead: (id) => set((state) => ({
                notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
            })),

            markAllRead: () => set((state) => ({
                notifications: state.notifications.map(n => ({ ...n, read: true }))
            })),

            clearAll: () => set({ notifications: [] }),

            removeNotification: (id) => set((state) => ({
                notifications: state.notifications.filter(n => n.id !== id)
            })),

            getUnreadCount: () => get().notifications.filter(n => !n.read).length,

            toggleAlertRule: (id) => set((state) => ({
                alertRules: state.alertRules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
            })),
        }),
        { name: 'aegis-notification-store' }
    )
);
