export interface ComplianceLink {
    id: string;
    source: string; // Asset ID (e.g. 'inf-1')
    target: string; // Policy ID (e.g. 'pol-1' - mapped conceptually, might need mock node if policy not in graph)
    // For MVP, we might need to map to nodes that EXIST in the graph. 
    // Let's assume we link Infrastructure Nodes to other Infrastructure Nodes (simulating policy flow) 
    // OR we fake "Policy Nodes" dynamically if we want to show direct linkage.
    // BETTER STRATEGY for MVP: Link Assets to a "Policy Hub" node if it exists, or just link Assets to each other representing "Flow Compliance".

    // ACTUALLY: The cleanest way is to link Assets to specific "Control Nodes" or just highlight existing edges.
    // But the requirement is "Asset -> Policy". 
    // Let's verify what nodes are in the graph first. 
    // Assuming standard data, I'll create links between existing mock nodes for now.

    status: 'COMPLIANT' | 'VIOLATION' | 'WARNING';
    reason: string;
}

// Mock Links connecting our existing hardcoded nodes from nexus-graph.tsx
// Nodes in graph: 'hub', 'net-1', 'net-2', 'inf-1'...'inf-4', 'app-1'...'app-3'
export const MOCK_COMPLIANCE_LINKS: ComplianceLink[] = [
    {
        id: 'cl-1',
        source: 'inf-1', // Primary DB
        target: 'hub',   // Linking to Central Hub (representing "Corporate Policy Core")
        status: 'COMPLIANT',
        reason: 'Data Retention: Encrypted at Rest (AES-256)'
    },
    {
        id: 'cl-2',
        source: 'app-1', // Legacy Portal
        target: 'hub',
        status: 'VIOLATION',
        reason: 'Authentication: Missing MFA for Admin Access'
    },
    {
        id: 'cl-3',
        source: 'inf-3', // Redis Cache
        target: 'inf-1', // Linking to DB
        status: 'WARNING',
        reason: 'Data Flow: Unencrypted internal traffic detected'
    },
    {
        id: 'cl-4',
        source: 'app-3', // Auth Service
        target: 'hub',
        status: 'COMPLIANT',
        reason: 'Identity: OAuth2.0 / OIDC Compliant'
    }
];
