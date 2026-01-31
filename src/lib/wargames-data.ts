export type ScenarioType = 'RANSOMWARE' | 'DDOS' | 'INSIDER' | 'DATA_LEAK' | 'BCP' | 'BREACH' | string;

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
    id: string;
    title: string;
    description: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'LETHAL';
    steps: Record<string, GameStep>;
    initialStepId: string;
    isCustom?: boolean;
}

export const SCENARIOS: Record<string, Scenario> = {
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
    DDOS: {
        id: 'DDOS',
        title: 'Tsunami Wave',
        description: 'A 2.5 Tbps volumetric DDoS attack is hitting your primary ingress. ISP links are saturated.',
        difficulty: 'EASY',
        initialStepId: 'start',
        steps: {
            'start': {
                id: 'start',
                title: 'Traffic Spike Detected',
                description: 'Network Operations Center (NOC) reports 90% packet loss. Valid user traffic is being dropped. Public website is unreachable.',
                choices: [
                    {
                        id: 'd1',
                        text: 'Route to Scrubbing Center',
                        description: 'Divert traffic to Prolexic/Cloudflare for cleaning.',
                        risk: 'LOW',
                        cost: 50000,
                        nextStepId: 'scrubbing_success',
                        feedback: 'Standard procedure. It costs money, but service is refined immediately.'
                    },
                    {
                        id: 'd2',
                        text: 'Blackhole Suspicious IPs',
                        description: 'Ask ISP to null-route traffic from attacking geolocations.',
                        risk: 'HIGH',
                        cost: 0,
                        nextStepId: 'blackhole_fail',
                        feedback: 'You blocked the attackers, but also legitimate customers from those regions.'
                    }
                ]
            },
            'scrubbing_success': {
                id: 'scrubbing_success',
                title: 'Mitigation Active',
                description: 'Traffic is clean. However, the attackers are now targeting your API endpoints with slow-loris attacks, bypassing volumetric filters.',
                choices: [
                    {
                        id: 'd3',
                        text: 'Enable CAPTCHA & Rate Limiting',
                        description: 'Aggressive WAF rules on all endpoints.',
                        risk: 'MEDIUM',
                        cost: 5000,
                        nextStepId: 'end_good',
                        feedback: 'Users are annoyed by CAPTCHAs, but the site stays up. Attackers give up.'
                    },
                    {
                        id: 'd4',
                        text: 'Scale Infrastructure',
                        description: 'Spin up 50% more web servers to absorb the load.',
                        risk: 'MEDIUM',
                        cost: 25000,
                        nextStepId: 'end_neutral',
                        feedback: 'You absorbed the load, but cost spiked. A temporary fix, not a solution.'
                    }
                ]
            },
            'blackhole_fail': {
                id: 'blackhole_fail',
                title: 'Collateral Damage',
                description: 'Support lines are flooded. "Why is the site down in Europe?" You stopped the DDoS but killed the business.',
                choices: [],
                isEnding: true,
                scoreImpact: 40
            },
            'end_good': { id: 'end_good', title: 'Defended', description: 'Service uptime: 99.9%. Cost managed. Good work.', choices: [], isEnding: true, scoreImpact: 100 },
            'end_neutral': { id: 'end_neutral', title: 'Survived', description: 'You spent a lot of money to brute-force a solution.', choices: [], isEnding: true, scoreImpact: 70 }
        }
    },
    INSIDER: {
        id: 'INSIDER',
        title: 'The Mole',
        description: 'DLP triggers signal a senior engineer is exfiltrating IP to a private Dropbox account.',
        difficulty: 'LETHAL',
        initialStepId: 'start',
        steps: {
            'start': {
                id: 'start',
                title: 'Suspicious Activity',
                description: 'User "jdoe" (Senior Architect) uploaded "Project_Chimera_Blueprints.zip" (2GB) to a personal drive. He has admin access.',
                choices: [
                    {
                        id: 'i1',
                        text: 'Immediate Termination',
                        description: 'Revoke all tokens, lock laptop, fire him immediately.',
                        risk: 'HIGH',
                        cost: 10000,
                        nextStepId: 'legal_nightmare',
                        feedback: 'He claims it was for work. You have no proof of malice yet. HR is furious.'
                    },
                    {
                        id: 'i2',
                        text: 'Silent Monitoring',
                        description: 'Deploy screen recording and keyloggers. Gather evidence.',
                        risk: 'MEDIUM',
                        cost: 5000,
                        nextStepId: 'evidence_gathering',
                        feedback: 'Smart. You need to know intent before acting.'
                    }
                ]
            },
            'legal_nightmare': {
                id: 'legal_nightmare',
                title: 'Wrongful Termination Scrutiny',
                description: 'Legal calls. "Jdoe" is suing. He says he was backing up work because the file server was flaky.',
                choices: [],
                isEnding: true,
                scoreImpact: 30
            },
            'evidence_gathering': {
                id: 'evidence_gathering',
                title: 'The Evidence',
                description: 'Screen logs show him chatting with a competitor on Signal. He is selling the source code.',
                choices: [
                    {
                        id: 'i3',
                        text: 'Sting Operation (Involve FBI)',
                        description: 'Coordinate with law enforcement to catch the hand-off.',
                        risk: 'MEDIUM',
                        cost: 20000,
                        nextStepId: 'end_good',
                        feedback: 'FBI arrested him. Competitor indicted. You are a hero.'
                    },
                    {
                        id: 'i4',
                        text: 'Confront & NDA',
                        description: 'Quietly let him go in exchange for signing strict NDAs.',
                        risk: 'HIGH',
                        cost: 0,
                        nextStepId: 'end_bad',
                        feedback: 'He signed, but leaked it anyway 6 months later. Weak response.'
                    }
                ]
            },
            'end_good': { id: 'end_good', title: 'Justice Served', description: 'Insider threat neutralized legally and technically.', choices: [], isEnding: true, scoreImpact: 100 },
            'end_bad': { id: 'end_bad', title: 'IP Lost', description: 'The competitor launched a clone product. Your stock dipped.', choices: [], isEnding: true, scoreImpact: 20 }
        }
    },
    DATA_LEAK: {
        id: 'DATA_LEAK',
        title: 'Leaks & Geeks',
        description: 'A known threat actor posts a sample of your user database on a dark web forum.',
        difficulty: 'MEDIUM',
        initialStepId: 'start',
        steps: {
            'start': {
                id: 'start',
                title: 'The Forum Post',
                description: 'Intel team spots the post. 1000 records sample. Emails, Hashes, and... Social Security Numbers.',
                choices: [
                    {
                        id: 'l1',
                        text: 'Public Disclosure Immediately',
                        description: 'Notify all customers and Press to get ahead of the story.',
                        risk: 'HIGH',
                        cost: 100000,
                        nextStepId: 'pr_storm',
                        feedback: 'Transparent, but maybe premature. Was the sample real? Stock drops 5%.'
                    },
                    {
                        id: 'l2',
                        text: 'Verify Authenticity',
                        description: 'Quietly cross-reference the sample with production DB.',
                        risk: 'LOW',
                        cost: 5000,
                        nextStepId: 'verification',
                        feedback: 'Prudent. You confirmed the data is from a 2-year old test environment.'
                    }
                ]
            },
            'pr_storm': {
                id: 'pr_storm',
                title: 'Media Frenzy',
                description: 'Reporters are camping in the lobby. You admitted to a breach before confirming the scope.',
                choices: [],
                isEnding: true,
                scoreImpact: 50
            },
            'verification': {
                id: 'verification',
                title: 'Scope Confirmed',
                description: 'It is a Test DB from dev environment. 50,000 old records. No active production passwords.',
                choices: [
                    {
                        id: 'l3',
                        text: 'Limited Notification',
                        description: 'Email only the affected 50k users. No press release.',
                        risk: 'LOW',
                        cost: 20000,
                        nextStepId: 'end_good',
                        feedback: 'Correct response. Incident contained. Regulatory fines minimal.'
                    },
                    {
                        id: 'l4',
                        text: 'Full transparency',
                        description: 'Tell the world anyway.',
                        risk: 'LOW',
                        cost: 50000,
                        nextStepId: 'end_neutral',
                        feedback: 'Honest, but you spooked the market for a non-critical issue.'
                    }
                ]
            },
            'end_good': { id: 'end_good', title: 'Crisis Managed', description: 'Surgical response saved the brand reputation.', choices: [], isEnding: true, scoreImpact: 95 },
            'end_neutral': { id: 'end_neutral', title: 'Over-reaction', description: 'You survived, but spent too much political capital.', choices: [], isEnding: true, scoreImpact: 75 }
        }
    },
    BCP: {
        id: 'BCP',
        title: 'Act of God',
        description: 'A Category 4 Hurricane is projected to hit your primary Data Center in Florida in 48 hours.',
        difficulty: 'MEDIUM',
        initialStepId: 'start',
        steps: {
            'start': {
                id: 'start',
                title: 'The Forecast',
                description: 'NOAA confirms direct hit probability 80%. Diesel generators have 24h fuel. Roads will close in 12h.',
                choices: [
                    {
                        id: 'b1',
                        text: 'Pre-emptive Failover (Hot Site)',
                        description: 'Shift traffic to Arizona DC immediately.',
                        risk: 'LOW',
                        cost: 50000,
                        nextStepId: 'end_good',
                        feedback: 'Seamless transition. Florida DC went underwater 2 days later. You saved the company.'
                    },
                    {
                        id: 'b2',
                        text: 'Ride it Out',
                        description: 'Trust the bunker construction and generators.',
                        risk: 'HIGH',
                        cost: 0,
                        nextStepId: 'bunker_fail',
                        feedback: 'The roof held, but fiber lines were cut by trees. You are offline.'
                    }
                ]
            },
            'bunker_fail': {
                id: 'bunker_fail',
                title: 'Blackout',
                description: 'You are offline for 3 weeks. Competitors stole 15% market share.',
                choices: [],
                isEnding: true,
                scoreImpact: 10
            },
            'end_good': { id: 'end_good', title: 'Business As Usual', description: 'Zero downtime. The CFO complained about the cost, but thanked you later.', choices: [], isEnding: true, scoreImpact: 100 }
        }
    },
    BREACH: {
        id: 'BREACH',
        title: 'Red Alert: APT',
        description: 'Advanced Persistent Threat (APT29) detected lateral movement in the Cardholder Data Environment (CDE).',
        difficulty: 'LETHAL',
        initialStepId: 'start',
        steps: {
            'start': {
                id: 'start',
                title: 'Contact Detected',
                description: 'The Eradication team sees active shells on 3 servers. They are moving towards the DB.',
                choices: [
                    {
                        id: 'br1',
                        text: 'Burn It Down',
                        description: 'Disconnect the internet. Rebuild CDE from scratch.',
                        risk: 'HIGH',
                        cost: 500000,
                        nextStepId: 'scorched_earth',
                        feedback: 'Nuclear option. You stopped the theft, but business is dead for a week.'
                    },
                    {
                        id: 'br2',
                        text: 'Live Forensics',
                        description: 'Watch them. Learn their TTPs. Contain without tipping them off.',
                        risk: 'HIGH',
                        cost: 100000,
                        nextStepId: 'cat_mouse',
                        feedback: 'Risky. If you miss one backdoor, they stay forever.'
                    }
                ]
            },
            'scorched_earth': { id: 'end_neutral', title: 'Pyrrhic Victory', description: 'You saved the data, but lost a week of revenue.', choices: [], isEnding: true, scoreImpact: 50 },
            'cat_mouse': {
                id: 'cat_mouse',
                title: 'The Trap',
                description: 'You identified their C2 server and blocked it. They are locked out.',
                choices: [
                    {
                        id: 'br3',
                        text: 'Clean & Patch',
                        description: 'Reimage infected hosts and patch the vulnerability.',
                        risk: 'LOW',
                        cost: 50000,
                        nextStepId: 'end_good',
                        feedback: 'Textbook remediation.'
                    }
                ]
            },
            'end_good': { id: 'end_good', title: 'Threat Neutralized', description: 'Attack repelled. Zero data loss.', choices: [], isEnding: true, scoreImpact: 100 }
        }
    }
};
