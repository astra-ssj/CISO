export type ScenarioType = 'RANSOMWARE' | 'DDOS' | 'INSIDER' | 'DATA_LEAK';

export interface GameChoice {
    id: string;
    text: string;
    description?: string;
    risk: 'LOW' | 'MEDIUM' | 'HIGH';
    cost: number;
    nextStepId: string;
    feedback: string;
}

export interface GameStep {
    id: string;
    title: string;
    description: string;
    choices: GameChoice[];
    isEnding?: boolean;
    scoreImpact?: number;
}

export interface Scenario {
    id: ScenarioType;
    title: string;
    description: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'LETHAL';
    steps: Record<string, GameStep>; // steps by ID
    initialStepId: string;
}

export const SCENARIOS: Record<ScenarioType, Scenario> = {
    RANSOMWARE: {
        id: 'RANSOMWARE',
        title: 'Operation: Blackout',
        description: 'A critical server cluster is encrypted by the "VoidWalker" ransomware group. They demand 50 BTC.',
        difficulty: 'HARD',
        initialStepId: 'start',
        steps: {
            'start': {
                id: 'start',
                title: 'The Initial Alert',
                description: '03:00 AM. SOC Manager wakes you up. "VoidWalker" branding is on all Payment Gateway servers. Customers cannot process transactions. What is your immediate order?',
                choices: [
                    {
                        id: 'c1',
                        text: 'Shut Down Everything',
                        description: 'Pull the plug on the entire data center to stop the spread.',
                        risk: 'HIGH',
                        cost: 500000,
                        nextStepId: 'containment_panic',
                        feedback: 'Effective, but you just caused a massive outage triggering SLA penalties.'
                    },
                    {
                        id: 'c2',
                        text: 'Isolate & Failover',
                        description: 'Sever network links to infected VLANs and activate Hot-Site DR.',
                        risk: 'MEDIUM',
                        cost: 100000,
                        nextStepId: 'analysis',
                        feedback: 'Good containment. Business continuity is maintained at 50% capacity.'
                    }
                ]
            },
            'containment_panic': {
                id: 'containment_panic',
                title: 'Darkness Falls',
                description: 'The data center is dark. Revenue is $0/hr. The CEO is screaming on the phone. The attackers are mocking you on X (Twitter).',
                isEnding: false,
                choices: [
                    {
                        id: 'c3',
                        text: 'Pay the Ransom (50 BTC)',
                        description: 'Get the decryptor and restore fast.',
                        risk: 'HIGH',
                        cost: 3000000,
                        nextStepId: 'end_bad',
                        feedback: 'You paid criminals. OFAC is investigating you. And the decryptor is slow.'
                    },
                    {
                        id: 'c4',
                        text: 'Restore from Tape Backups',
                        description: 'Slow, painful, but clean.',
                        risk: 'LOW',
                        cost: 200000,
                        nextStepId: 'end_neutral',
                        feedback: 'It took 4 days, but you recovered without paying. Reputation took a hit.'
                    }
                ]
            },
            'analysis': {
                id: 'analysis',
                title: 'The Negotiation',
                description: 'Systems are stable but degraded. Attackers offer to delete exfiltrated customer data for a "discounted" 10 BTC.',
                choices: [
                    {
                        id: 'c5',
                        text: 'Engage Negotiators',
                        description: 'Stall them while FBI traces the wallet.',
                        risk: 'MEDIUM',
                        cost: 50000,
                        nextStepId: 'end_good',
                        feedback: 'Stalling worked. Intel confirms they are bluffing about the data. You win.'
                    },
                    {
                        id: 'c6',
                        text: 'Ignore Them',
                        description: 'Focus purely on technical recovery.',
                        risk: 'MEDIUM',
                        cost: 0,
                        nextStepId: 'end_neutral',
                        feedback: 'They leaked some minor data, but you saved money. Acceptable outcome.'
                    }
                ]
            },
            'end_bad': { id: 'end_bad', title: 'GAME OVER: Compromised', description: 'You survived, but at what cost? Role terminated.', choices: [], isEnding: true, scoreImpact: 20 },
            'end_neutral': { id: 'end_neutral', title: 'MISSION COMPLETE: Survival', description: 'You kept the business alive. Board is neutral.', choices: [], isEnding: true, scoreImpact: 60 },
            'end_good': { id: 'end_good', title: 'MISSION COMPLETE: Hero', description: 'Zero payments. Minimal downtime. Exemplary leadership.', choices: [], isEnding: true, scoreImpact: 100 }
        }
    },
    DDOS: { id: 'DDOS', title: 'Tsunami Wave', description: 'Coming Soon', difficulty: 'EASY', initialStepId: 'start', steps: { 'start': { id: 'start', title: 'Placeholder', description: 'Placeholder', choices: [] } } },
    INSIDER: { id: 'INSIDER', title: 'The Mole', description: 'Coming Soon', difficulty: 'LETHAL', initialStepId: 'start', steps: { 'start': { id: 'start', title: 'Placeholder', description: 'Placeholder', choices: [] } } },
    DATA_LEAK: { id: 'DATA_LEAK', title: 'Leaks & Geeks', description: 'Coming Soon', difficulty: 'MEDIUM', initialStepId: 'start', steps: { 'start': { id: 'start', title: 'Placeholder', description: 'Placeholder', choices: [] } } }
};
