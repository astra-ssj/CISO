export type ComponentType = 'WEB_APP' | 'API' | 'DATABASE' | 'FILE_STORE' | 'EXTERNAL_SERVICE' | 'USER_BROWSER';

export interface Component {
    id: string;
    name: string;
    type: ComponentType;
    isPublic: boolean;
}

export interface DataFlow {
    id: string;
    sourceId: string;
    targetId: string;
    description: string;
    protocol: 'HTTPS' | 'HTTP' | 'SQL' | 'TCP' | 'SSH';
    hasAuthentication: boolean;
}

export interface Architecture {
    components: Component[];
    flows: DataFlow[];
}

export interface Threat {
    id: string;
    category: 'SPOOFING' | 'TAMPERING' | 'REPUDIATION' | 'INFORMATION_DISCLOSURE' | 'DENIAL_OF_SERVICE' | 'ELEVATION_OF_PRIVILEGE';
    title: string;
    description: string;
    mitigation: string;
    affectedComponentId?: string;
    affectedFlowId?: string;
}

export const analyzeArchitecture = (arch: Architecture): Threat[] => {
    const threats: Threat[] = [];

    arch.components.forEach(comp => {
        // SPOOFING: Public facing endpoints
        if (comp.isPublic && (comp.type === 'WEB_APP' || comp.type === 'API')) {
            threats.push({
                id: `th-spf-${comp.id}`,
                category: 'SPOOFING',
                title: 'Identity Spoofing Risk',
                description: `Public facing component '${comp.name}' is susceptible to identity spoofing attacks.`,
                mitigation: 'Implement strong Multi-Factor Authentication (MFA) and Session Management.',
                affectedComponentId: comp.id
            });
        }

        // TAMPERING: Databases/Stores
        if (comp.type === 'DATABASE' || comp.type === 'FILE_STORE') {
            threats.push({
                id: `th-tmp-${comp.id}`,
                category: 'TAMPERING',
                title: 'Data Integrity Violation',
                description: `Store '${comp.name}' is a high-value target for data tampering.`,
                mitigation: 'Enable Write-Ahead Logging (WAL) and File Integrity Monitoring (FIM).',
                affectedComponentId: comp.id
            });
        }
    });

    arch.flows.forEach(flow => {
        // INFORMATION DISCLOSURE: Unencrypted Protocols
        if (flow.protocol === 'HTTP' || flow.protocol === 'TCP') {
            threats.push({
                id: `th-inf-${flow.id}`,
                category: 'INFORMATION_DISCLOSURE',
                title: 'Cleartext Data Transmission',
                description: `Data flow '${flow.description}' uses unencrypted protocol ${flow.protocol}.`,
                mitigation: 'Enforce TLS 1.3 for all data in transit.',
                affectedFlowId: flow.id
            });
        }

        // ELEVATION OF PRIVILEGE: Missing Auth
        if (!flow.hasAuthentication) {
            threats.push({
                id: `th-eop-${flow.id}`,
                category: 'ELEVATION_OF_PRIVILEGE',
                title: 'Unrestricted Access',
                description: `Flow '${flow.description}' allows access without authentication validation.`,
                mitigation: 'Implement Mutual TLS (mTLS) or OAuth2/OIDC token validation.',
                affectedFlowId: flow.id
            });
        }
    });

    return threats;
};

export const generateMermaidDiagram = (arch: Architecture, threats: Threat[]): string => {
    let diagram = 'flowchart TD\n';

    // Styles
    diagram += '    classDef public fill:#f9f,stroke:#333,stroke-width:2px;\n';
    diagram += '    classDef store fill:#dbf,stroke:#333,stroke-width:2px;\n';
    diagram += '    classDef threat fill:#f00,stroke:#333,stroke-width:4px,color:#fff;\n';

    // Components
    arch.components.forEach(comp => {
        let styleClass = '';
        if (comp.isPublic) styleClass = ':::public';
        if (comp.type === 'DATABASE' || comp.type === 'FILE_STORE') styleClass = ':::store';

        // Check for threats to highlight
        const hasThreat = threats.some(t => t.affectedComponentId === comp.id);
        if (hasThreat) styleClass = ':::threat';

        diagram += `    ${comp.id}[${comp.name}]${styleClass}\n`;
    });

    // Flows
    arch.flows.forEach(flow => {
        const hasThreat = threats.some(t => t.affectedFlowId === flow.id);
        const linkStyle = hasThreat ? 'stroke:red,stroke-width:4px' : '';

        diagram += `    ${flow.sourceId} -- "${flow.protocol}: ${flow.description}" --> ${flow.targetId}\n`;
        if (hasThreat) {
            diagram += `    linkStyle ${arch.flows.indexOf(flow)} ${linkStyle}\n`;
        }
    });

    return diagram;
};
