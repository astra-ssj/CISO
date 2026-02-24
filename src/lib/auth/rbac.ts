export type UserRole = 'CISO' | 'SEC_ENGINEER' | 'AUDITOR' | 'VIEWER';

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatarUrl?: string;
    lastLogin: string;
}

export const ROLES: Record<UserRole, { label: string; permissions: string[] }> = {
    CISO: {
        label: 'Chief Information Security Officer',
        permissions: ['*'], // Admin access (includes caiq:*)
    },
    SEC_ENGINEER: {
        label: 'Security Engineer',
        permissions: ['policy:write', 'incident:write', 'settings:read', 'caiq:assess', 'caiq:review'],
    },
    AUDITOR: {
        label: 'Compliance Auditor',
        permissions: ['policy:read', 'incident:read', 'audit:read', 'report:export', 'caiq:read'],
    },
    VIEWER: {
        label: 'Viewer',
        permissions: ['dashboard:read'],
    },
};

export function hasPermission(user: UserProfile, permission: string): boolean {
    const userPermissions = ROLES[user.role].permissions;
    if (userPermissions.includes('*')) return true;
    return userPermissions.includes(permission);
}

export function canAccessRoute(role: UserRole, path: string): boolean {
    if (role === 'CISO') return true;

    // CAIQ: CISO full; SEC_ENGINEER assess + review; AUDITOR read-only; VIEWER no access
    if (path.startsWith('/vendors/caiq') || path.startsWith('/vendors/caiq-review')) {
        if (role === 'VIEWER') return false;
        return role === 'SEC_ENGINEER' || role === 'AUDITOR';
    }

    // Route-based protection rules
    if (path.startsWith('/settings')) return role === 'SEC_ENGINEER'; // Only CISO/Eng can edit settings
    // Default allow for dashboard
    return true;
}
