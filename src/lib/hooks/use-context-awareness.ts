import { usePathname } from 'next/navigation';
import { useUnificationStore } from '../unification-store';
// import { usePolicyStore } from '../policy-store'; // Uncomment when used

export interface ContextPayload {
    page: string;
    selectedNode?: {
        id: string;
        violation?: string;
    };
    activeConstraints?: string[];
    timestamp: string;
}

export function useContextAwareness(): ContextPayload {
    const pathname = usePathname();
    const { selectedNodeId, activeConstraints } = useUnificationStore();

    // Derive readable page name
    const getPageName = (path: string) => {
        if (path === '/') return 'Command Center';
        if (path.includes('nexus')) return 'Nexus Graph';
        if (path.includes('policies')) return 'Policy Governance';
        if (path.includes('executive')) return 'Executive Brief';
        return 'Unknown';
    };

    // Build context object
    const context: ContextPayload = {
        page: getPageName(pathname),
        timestamp: new Date().toISOString(),
    };

    // Add Nexus Context
    if (selectedNodeId) {
        const violation = activeConstraints.find(c => c.affectedNodeIds.includes(selectedNodeId));
        context.selectedNode = {
            id: selectedNodeId,
            violation: violation ? violation.name : undefined
        };
    }

    // Add Active Constraints Context
    if (activeConstraints.length > 0) {
        context.activeConstraints = activeConstraints.map(c => c.name);
    }

    return context;
}
