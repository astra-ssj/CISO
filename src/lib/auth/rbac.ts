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
        permissions: ['*'],
    },
    SEC_ENGINEER: {
        label: 'Security Engineer',
        permissions: [
            'dashboard:read',
            'policy:read', 'policy:write',
            'risk:read', 'risk:write',
            'vendor:read', 'vendor:write',
            'evidence:read', 'evidence:write',
            'decision:read', 'decision:create',
            'incident:read', 'incident:write',
            'settings:read',
            'caiq:read', 'caiq:assess', 'caiq:review',
        ],
    },
    AUDITOR: {
        label: 'Compliance Auditor',
        permissions: [
            'dashboard:read',
            'policy:read',
            'risk:read',
            'vendor:read',
            'evidence:read',
            'decision:read',
            'incident:read',
            'audit:read',
            'report:export',
            'caiq:read',
        ],
    },
    VIEWER: {
        label: 'Viewer',
        permissions: ['dashboard:read'],
    },
};

export function hasPermission(user: UserProfile, permission: string): boolean {
    const userPermissions = ROLES[user.role]?.permissions ?? [];
    if (userPermissions.includes('*')) return true;
    return userPermissions.includes(permission);
}

export function canAccessRoute(role: UserRole, path: string): boolean {
    if (role === 'CISO') return true;

    if (path.startsWith('/vendors/caiq') || path.startsWith('/vendors/caiq-review')) {
        if (role === 'VIEWER') return false;
        return role === 'SEC_ENGINEER' || role === 'AUDITOR';
    }

    if (path.startsWith('/settings')) return role === 'SEC_ENGINEER';
    return true;
}
