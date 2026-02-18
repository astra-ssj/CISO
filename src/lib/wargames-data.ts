export type ScenarioType = 'RANSOMWARE' | 'DDOS' | 'INSIDER' | 'DATA_LEAK' | 'BCP' | 'BREACH' | 'SUPPLY_CHAIN' | 'ZERO_DAY' | 'CLOUD_MISCONFIG' | 'PHISHING' | string;

export interface GameChoice {
    id: string;
    text: string;
    description?: string;
    risk: 'LOW' | 'MEDIUM' | 'HIGH';
    cost: number;
    nextStepId: string;
    feedback: string;
    timeImpact?: number;
    reputationImpact?: number;
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
    mitreTactics?: string[];
    estimatedDuration?: number;
    category?: 'TECHNICAL' | 'GOVERNANCE' | 'HYBRID';
    realWorldReference?: string;
}

export const SCENARIOS: Record<string, Scenario> = {
    RANSOMWARE: {
        id: 'RANSOMWARE',
        title: 'Operation: Blackout',
        description: 'A critical server cluster is encrypted by the "VoidWalker" ransomware group. They demand 50 BTC. Payment gateway is down.',
        difficulty: 'HARD',
        initialStepId: 'start',
        mitreTactics: ['TA0001', 'TA0002', 'TA0040', 'TA0010'],
        estimatedDuration: 8,
        category: 'TECHNICAL',
        realWorldReference: 'Based on: Colonial Pipeline (2021)',
        steps: {
            'start': {
                id: 'start', title: 'The Initial Alert',
                description: '03:00 AM. SOC Manager wakes you. "VoidWalker" branding on all Payment Gateway servers. Customers cannot process transactions. Revenue loss: $150K/hour.',
                choices: [
                    { id: 'c1', text: 'Shut Down Everything', description: 'Pull the plug on the entire DC to stop spread.', risk: 'HIGH', cost: 500000, nextStepId: 'containment_panic', feedback: 'Effective containment, but you triggered SLA penalties and a total outage.', reputationImpact: -15 },
                    { id: 'c2', text: 'Isolate & Failover', description: 'Sever infected VLANs, activate Hot-Site DR.', risk: 'MEDIUM', cost: 100000, nextStepId: 'forensics', feedback: 'Good containment. Business runs at 50% capacity.', reputationImpact: -5 },
                    { id: 'c3', text: 'Monitor & Assess', description: 'Observe attacker movements before acting.', risk: 'HIGH', cost: 0, nextStepId: 'spread', feedback: 'Risky. You gain intel but the ransomware encrypts 3 more servers while you watch.', reputationImpact: -10 }
                ]
            },
            'containment_panic': {
                id: 'containment_panic', title: 'Darkness Falls',
                description: 'DC is dark. Revenue: $0/hr. CEO is on the phone screaming. Attackers mock you on X. Board wants answers in 2 hours.',
                choices: [
                    { id: 'c4', text: 'Pay the Ransom (50 BTC)', description: 'Get decryptor, restore fast.', risk: 'HIGH', cost: 3000000, nextStepId: 'ransom_aftermath', feedback: 'You paid criminals. OFAC may investigate. Decryptor is slow and buggy.' },
                    { id: 'c5', text: 'Restore from Immutable Backups', description: 'Slow but clean recovery from offsite tapes.', risk: 'LOW', cost: 200000, nextStepId: 'recovery', feedback: '4 days of downtime, but clean recovery. Board is relieved.' },
                    { id: 'c6', text: 'Negotiate for Time', description: 'Stall while FBI traces the wallet.', risk: 'MEDIUM', cost: 50000, nextStepId: 'forensics', feedback: 'Smart play. You buy 24 hours and shift to forensics.' }
                ]
            },
            'spread': {
                id: 'spread', title: 'Lateral Movement Detected',
                description: 'The ransomware spread to the ERP system and email servers. Total encrypted hosts: 47. Attackers raise demand to 75 BTC.',
                choices: [
                    { id: 'c7', text: 'Emergency Network Kill', description: 'Pull all uplinks NOW.', risk: 'HIGH', cost: 750000, nextStepId: 'containment_panic', feedback: 'Finally contained, but damage is far worse than if you acted immediately.' },
                    { id: 'c8', text: 'Segment & Recover', description: 'Isolate clean segments, rebuild incrementally.', risk: 'MEDIUM', cost: 300000, nextStepId: 'recovery', feedback: 'Methodical approach. Takes a week but preserves some operations.' },
                    { id: 'c9', text: 'Call Incident Response Firm', description: 'Engage CrowdStrike/Mandiant immediately.', risk: 'LOW', cost: 500000, nextStepId: 'forensics', feedback: 'Expensive but expert help stabilizes the situation within hours.' }
                ]
            },
            'forensics': {
                id: 'forensics', title: 'The Root Cause',
                description: 'Forensics reveals entry via a compromised VPN credential (no MFA). Attackers had access for 3 weeks. They exfiltrated 2TB before encrypting.',
                choices: [
                    { id: 'c10', text: 'Engage Negotiators', description: 'Stall attackers while assessing data exposure.', risk: 'MEDIUM', cost: 50000, nextStepId: 'comms', feedback: 'Intel confirms they are partially bluffing. Not all data is sensitive.' },
                    { id: 'c11', text: 'Full Rebuild + Disclosure', description: 'Nuke and pave. Notify regulators immediately.', risk: 'LOW', cost: 400000, nextStepId: 'comms', feedback: 'Transparent and thorough. Regulators appreciate the proactive notification.' },
                    { id: 'c12', text: 'Quiet Containment', description: 'Fix silently, assess breach notification obligations later.', risk: 'HIGH', cost: 100000, nextStepId: 'regulatory', feedback: 'Dangerous. If the leak surfaces publicly, you face obstruction charges.' }
                ]
            },
            'comms': {
                id: 'comms', title: 'The PR Crisis',
                description: 'Reuters calls: "Sources say your company was hit by ransomware." Board demands a public statement within the hour.',
                choices: [
                    { id: 'c13', text: 'Transparent Press Release', description: '"We detected and are remediating a cyber incident."', risk: 'LOW', cost: 75000, nextStepId: 'recovery', feedback: 'Stock dips 3% but recovers. Customers appreciate honesty.', reputationImpact: -5 },
                    { id: 'c14', text: '"No Comment"', description: 'Refuse to confirm or deny.', risk: 'MEDIUM', cost: 0, nextStepId: 'regulatory', feedback: 'Journalists dig deeper. Leaked screenshots surface. Worse coverage.', reputationImpact: -20 },
                    { id: 'c15', text: 'Controlled Leak via CISO Blog', description: 'Publish a detailed technical blog post to control the narrative.', risk: 'LOW', cost: 25000, nextStepId: 'recovery', feedback: 'Security community praises transparency. Positive media coverage.', reputationImpact: 5 }
                ]
            },
            'ransom_aftermath': {
                id: 'ransom_aftermath', title: 'The Fallout',
                description: 'Decryptor only works on 60% of files. Attackers demand another 20 BTC for the "full" key. FBI calls: your payment funded a sanctioned entity.',
                choices: [
                    { id: 'c16', text: 'Refuse & Rebuild', description: 'Accept the loss. Rebuild from backups.', risk: 'MEDIUM', cost: 300000, nextStepId: 'end_bad', feedback: 'You paid once and still had to rebuild. Double the cost.' },
                    { id: 'c17', text: 'Cooperate with FBI', description: 'Full cooperation. Accept potential sanctions investigation.', risk: 'LOW', cost: 200000, nextStepId: 'end_neutral', feedback: 'FBI appreciates cooperation. Sanctions risk is mitigated.' }
                ]
            },
            'regulatory': {
                id: 'regulatory', title: 'Regulatory Heat',
                description: 'State AG office sends a preservation notice. SEC is asking questions. Your silence is now a liability.',
                choices: [
                    { id: 'c18', text: 'Full Cooperation', description: 'Open books, provide all forensic reports.', risk: 'LOW', cost: 300000, nextStepId: 'end_neutral', feedback: 'Fine reduced to $500K. Could have been $5M.' },
                    { id: 'c19', text: 'Lawyer Up', description: 'Engage white-shoe law firm to manage responses.', risk: 'MEDIUM', cost: 1000000, nextStepId: 'end_neutral', feedback: 'Legal fees mount but you avoid the worst penalties.' }
                ]
            },
            'recovery': {
                id: 'recovery', title: 'Road to Recovery',
                description: 'Systems are coming back online. 72-hour sprint. MFA deployed everywhere. VPN replaced with Zero Trust. Board asks: "How do we prevent this?"',
                choices: [
                    { id: 'c20', text: 'Present Board-Ready Remediation Plan', description: '12-month hardening roadmap with budget ask.', risk: 'LOW', cost: 50000, nextStepId: 'end_good', feedback: 'Board approves $2M security budget increase. You are promoted.' },
                    { id: 'c21', text: 'Quick Fixes Only', description: 'Patch the VPN, add MFA, move on.', risk: 'MEDIUM', cost: 10000, nextStepId: 'end_neutral', feedback: 'You fixed the symptom but not the disease. Another attack in 6 months.' }
                ]
            },
            'end_bad': { id: 'end_bad', title: 'GAME OVER: Compromised', description: 'You paid the ransom, funded criminals, and still lost data. Board is discussing your replacement.', choices: [], isEnding: true, scoreImpact: 15 },
            'end_neutral': { id: 'end_neutral', title: 'MISSION COMPLETE: Survival', description: 'You kept the business alive, but it was painful and expensive. Lessons learned.', choices: [], isEnding: true, scoreImpact: 55 },
            'end_good': { id: 'end_good', title: 'MISSION COMPLETE: Exemplary Response', description: 'Zero ransom paid. Transparent handling. Security posture dramatically improved. CISO of the Year nominee.', choices: [], isEnding: true, scoreImpact: 100 }
        }
    },

    DDOS: {
        id: 'DDOS',
        title: 'Tsunami Wave',
        description: 'A 2.5 Tbps volumetric DDoS attack saturates your ISP links. Public services are unreachable.',
        difficulty: 'EASY',
        initialStepId: 'start',
        mitreTactics: ['TA0040', 'TA0005'],
        estimatedDuration: 5,
        category: 'TECHNICAL',
        realWorldReference: 'Based on: AWS Shield DDoS (2020)',
        steps: {
            'start': {
                id: 'start', title: 'Traffic Spike Detected',
                description: 'NOC reports 90% packet loss. Valid traffic is being dropped. Public website unreachable. E-commerce revenue: $0.',
                choices: [
                    { id: 'd1', text: 'Route to Scrubbing Center', description: 'Divert traffic to Cloudflare/Akamai.', risk: 'LOW', cost: 50000, nextStepId: 'scrubbing', feedback: 'Standard procedure. Service restored within 15 minutes.' },
                    { id: 'd2', text: 'Blackhole Suspicious IPs', description: 'Ask ISP to null-route attacking geolocations.', risk: 'HIGH', cost: 0, nextStepId: 'collateral', feedback: 'You blocked attackers AND legitimate customers from those regions.' },
                    { id: 'd3', text: 'Scale Infrastructure', description: 'Spin up 10x capacity to absorb the load.', risk: 'MEDIUM', cost: 150000, nextStepId: 'scaling_war', feedback: 'Attackers simply increase volume. You are in a spending war.' }
                ]
            },
            'scrubbing': {
                id: 'scrubbing', title: 'Layer 7 Attack Pivot',
                description: 'Volumetric attack is filtered. But attackers pivot to slow-loris HTTP attacks targeting your API. 500ms response times become 30s.',
                choices: [
                    { id: 'd4', text: 'WAF + Rate Limiting', description: 'Aggressive rules: CAPTCHA on suspicious IPs, 100 req/min limit.', risk: 'LOW', cost: 5000, nextStepId: 'attribution', feedback: 'Users annoyed by CAPTCHAs but site stays up. Effective defense.' },
                    { id: 'd5', text: 'Geographic Blocking', description: 'Block all traffic from top 5 attacking countries.', risk: 'HIGH', cost: 0, nextStepId: 'collateral', feedback: 'You blocked paying customers in 3 major markets.' },
                    { id: 'd6', text: 'API Gateway Redesign', description: 'Deploy edge caching and API throttling.', risk: 'MEDIUM', cost: 25000, nextStepId: 'attribution', feedback: 'Takes 2 hours to deploy but provides lasting protection.' }
                ]
            },
            'collateral': {
                id: 'collateral', title: 'Customer Impact',
                description: 'Support lines flooded: "Why is the site down in Europe?" CEO: "We just lost our EMEA quarterly target." Stock drops 2%.',
                choices: [
                    { id: 'd7', text: 'Revert & Use Scrubbing', description: 'Remove geo-blocks, switch to professional DDoS mitigation.', risk: 'LOW', cost: 75000, nextStepId: 'attribution', feedback: 'Better late than never. Service restored for all regions.' },
                    { id: 'd8', text: 'Maintain Blocks + Communicate', description: 'Email affected customers, offer service credits.', risk: 'MEDIUM', cost: 200000, nextStepId: 'end_neutral', feedback: 'Customers unhappy but appreciate the credits. Revenue loss is significant.' }
                ]
            },
            'scaling_war': {
                id: 'scaling_war', title: 'Budget Hemorrhage',
                description: 'Cloud bill is $500K and climbing. Attackers are using a botnet of 200K devices. CFO is calling every 30 minutes.',
                choices: [
                    { id: 'd9', text: 'Switch to Scrubbing Service', description: 'Admit defeat on scaling, use professionals.', risk: 'LOW', cost: 50000, nextStepId: 'attribution', feedback: 'Should have done this first. Cloud bill is already astronomical.' },
                    { id: 'd10', text: 'Contact ISP for Upstream Filtering', description: 'Ask ISP to filter at the backbone level.', risk: 'MEDIUM', cost: 10000, nextStepId: 'attribution', feedback: 'ISP cooperates. Reduces attack volume by 80%.' }
                ]
            },
            'attribution': {
                id: 'attribution', title: 'Who Is Behind This?',
                description: 'Threat intel links the attack to a competitor hiring a DDoS-for-hire service. You have the C2 IPs and payment records.',
                choices: [
                    { id: 'd11', text: 'Involve Law Enforcement', description: 'File FBI IC3 report with evidence.', risk: 'LOW', cost: 10000, nextStepId: 'hardening', feedback: 'FBI opens an investigation. Competitor faces federal charges.' },
                    { id: 'd12', text: 'Hack Back (Offensive)', description: 'Retaliate against the C2 infrastructure.', risk: 'HIGH', cost: 0, nextStepId: 'end_bad', feedback: 'You committed a federal crime. Your CISO career is over.' },
                    { id: 'd13', text: 'Document & Harden', description: 'Focus on defense. File evidence for future litigation.', risk: 'LOW', cost: 5000, nextStepId: 'hardening', feedback: 'Mature response. Evidence preserved for civil suit.' }
                ]
            },
            'hardening': {
                id: 'hardening', title: 'Never Again',
                description: 'Attack is over. Board asks for a prevention plan. Your current DDoS protection was clearly inadequate.',
                choices: [
                    { id: 'd14', text: 'Enterprise DDoS Protection Contract', description: '$200K/year always-on scrubbing + SLA.', risk: 'LOW', cost: 200000, nextStepId: 'end_good', feedback: 'Premium protection. Next attack is mitigated in under 60 seconds.' },
                    { id: 'd15', text: 'In-House + ISP Partnership', description: 'Build internal capability with ISP cooperation.', risk: 'MEDIUM', cost: 80000, nextStepId: 'end_good', feedback: 'Cost-effective. Takes 3 months to fully implement but solid.' },
                    { id: 'd16', text: 'Minimal Changes', description: '"It probably won\'t happen again."', risk: 'HIGH', cost: 0, nextStepId: 'end_neutral', feedback: 'It happened again 2 months later. This time you were fired.' }
                ]
            },
            'end_bad': { id: 'end_bad', title: 'GAME OVER: Criminal Charges', description: 'Your "hack back" violated the CFAA. You are under investigation.', choices: [], isEnding: true, scoreImpact: 5 },
            'end_neutral': { id: 'end_neutral', title: 'MISSION: Survived', description: 'You weathered the storm but the response was costly and slow.', choices: [], isEnding: true, scoreImpact: 55 },
            'end_good': { id: 'end_good', title: 'MISSION: Defended', description: 'Professional response. Attacker identified. Defenses hardened. Uptime: 99.9%.', choices: [], isEnding: true, scoreImpact: 100 }
        }
    },

    INSIDER: {
        id: 'INSIDER',
        title: 'The Mole',
        description: 'DLP triggers signal a senior engineer is exfiltrating IP to a personal cloud account. He has admin access to core systems.',
        difficulty: 'LETHAL',
        initialStepId: 'start',
        mitreTactics: ['TA0010', 'TA0009', 'TA0007'],
        estimatedDuration: 8,
        category: 'HYBRID',
        realWorldReference: 'Based on: Tesla Insider Threat (2020)',
        steps: {
            'start': {
                id: 'start', title: 'Suspicious Activity',
                description: 'User "jdoe" (Senior Architect, 8yr tenure) uploaded "Project_Chimera_Blueprints.zip" (2GB) to personal Dropbox. He has root access to production.',
                choices: [
                    { id: 'i1', text: 'Immediate Termination', description: 'Revoke all tokens, lock laptop, escort out.', risk: 'HIGH', cost: 10000, nextStepId: 'legal_nightmare', feedback: 'No proof of malice yet. HR and Legal are furious.' },
                    { id: 'i2', text: 'Silent Monitoring', description: 'Deploy endpoint monitoring. Gather evidence first.', risk: 'MEDIUM', cost: 5000, nextStepId: 'evidence', feedback: 'Smart. You need intent before action.' },
                    { id: 'i3', text: 'Direct Confrontation', description: 'Call him in for a casual "chat" about data handling.', risk: 'MEDIUM', cost: 0, nextStepId: 'tipped_off', feedback: 'He senses something is off and accelerates his plans.' }
                ]
            },
            'legal_nightmare': {
                id: 'legal_nightmare', title: 'Wrongful Termination',
                description: 'Jdoe\'s lawyer calls. He says he was backing up work because company file servers were unreliable. He\'s filing a wrongful termination suit.',
                choices: [
                    { id: 'i4', text: 'Settle Quietly', description: 'Pay severance, sign mutual NDA.', risk: 'MEDIUM', cost: 250000, nextStepId: 'end_bad', feedback: 'He got paid twice — once by the competitor, once by you.' },
                    { id: 'i5', text: 'Fight It — Get Evidence', description: 'Forensically image his devices now.', risk: 'LOW', cost: 50000, nextStepId: 'evidence', feedback: 'Better late than never. Forensics finds the Signal chats.' }
                ]
            },
            'tipped_off': {
                id: 'tipped_off', title: 'Acceleration',
                description: 'Monitoring shows jdoe is now downloading at 3x speed. He\'s copying the entire R&D repo. You have maybe 4 hours before he\'s done.',
                choices: [
                    { id: 'i6', text: 'Kill His Access Now', description: 'Revoke all credentials immediately.', risk: 'MEDIUM', cost: 5000, nextStepId: 'evidence', feedback: 'He\'s locked out but already has 60% of the data. Damage is done.' },
                    { id: 'i7', text: 'Poison the Data', description: 'Inject watermarked/modified files into the repo.', risk: 'MEDIUM', cost: 10000, nextStepId: 'evidence', feedback: 'Clever. When the competitor uses the data, you can prove theft.' }
                ]
            },
            'evidence': {
                id: 'evidence', title: 'The Evidence',
                description: 'Screen logs show jdoe chatting with a competitor on Signal. He\'s selling source code for $500K. You have screenshots and network logs.',
                choices: [
                    { id: 'i8', text: 'FBI Sting Operation', description: 'Coordinate with law enforcement for a controlled hand-off.', risk: 'MEDIUM', cost: 20000, nextStepId: 'legal_action', feedback: 'FBI is engaged. They want to catch the buyer too.' },
                    { id: 'i9', text: 'Confront with Evidence', description: 'Terminate with cause, present evidence.', risk: 'LOW', cost: 10000, nextStepId: 'civil_action', feedback: 'He\'s fired. But criminal prosecution is harder without FBI involvement.' },
                    { id: 'i10', text: 'Quiet NDA Exit', description: 'Let him go with strict NDAs.', risk: 'HIGH', cost: 100000, nextStepId: 'end_bad', feedback: 'He signed, leaked 6 months later. Weak response.' }
                ]
            },
            'legal_action': {
                id: 'legal_action', title: 'The Sting',
                description: 'FBI arrests jdoe during the hand-off at a café. Competitor\'s VP of Engineering is also arrested. Media wants a statement.',
                choices: [
                    { id: 'i11', text: 'Public Statement', description: '"We take IP protection seriously and cooperated with law enforcement."', risk: 'LOW', cost: 25000, nextStepId: 'prevention', feedback: 'Strong message. Deters future insiders. Stock rises 2%.', reputationImpact: 10 },
                    { id: 'i12', text: 'No Comment', description: 'Let the FBI handle communications.', risk: 'LOW', cost: 0, nextStepId: 'prevention', feedback: 'Fine, but you missed a chance to strengthen your brand.' }
                ]
            },
            'civil_action': {
                id: 'civil_action', title: 'Civil Prosecution',
                description: 'You file a civil suit against jdoe and the competitor. It will take 2 years, but monetary damages could be significant.',
                choices: [
                    { id: 'i13', text: 'Pursue Full Damages', description: 'Sue for $10M+ including trade secret damages.', risk: 'MEDIUM', cost: 500000, nextStepId: 'prevention', feedback: 'Lengthy process but you settle for $3M and an injunction.' },
                    { id: 'i14', text: 'Injunction Only', description: 'Just stop the competitor from using the code.', risk: 'LOW', cost: 100000, nextStepId: 'prevention', feedback: 'Quick resolution. Code use is enjoined. Competitor pivots.' }
                ]
            },
            'prevention': {
                id: 'prevention', title: 'Preventing the Next Mole',
                description: 'Board asks: "How do we prevent this from happening again?" Your insider threat program was clearly insufficient.',
                choices: [
                    { id: 'i15', text: 'Full Insider Threat Program', description: 'UEBA, DLP, privileged access management, annual training.', risk: 'LOW', cost: 300000, nextStepId: 'end_good', feedback: 'Comprehensive program. You detect the next attempt within hours.' },
                    { id: 'i16', text: 'Technical Controls Only', description: 'DLP + endpoint monitoring. No culture changes.', risk: 'MEDIUM', cost: 100000, nextStepId: 'end_neutral', feedback: 'Tools help but culture is unchanged. Another incident in 18 months.' },
                    { id: 'i17', text: 'Trust But Verify', description: 'Periodic access reviews, no major investment.', risk: 'HIGH', cost: 20000, nextStepId: 'end_neutral', feedback: 'Minimal effort. Board is unimpressed.' }
                ]
            },
            'end_bad': { id: 'end_bad', title: 'GAME OVER: IP Lost', description: 'Competitor launched a clone product. Your stock dipped 15%. Board is furious.', choices: [], isEnding: true, scoreImpact: 15 },
            'end_neutral': { id: 'end_neutral', title: 'MISSION: Contained', description: 'Threat neutralized but prevention is weak. You survive but don\'t thrive.', choices: [], isEnding: true, scoreImpact: 55 },
            'end_good': { id: 'end_good', title: 'MISSION: Justice Served', description: 'Insider arrested. Competitor indicted. Comprehensive prevention deployed. You are the benchmark.', choices: [], isEnding: true, scoreImpact: 100 }
        }
    },

    DATA_LEAK: {
        id: 'DATA_LEAK',
        title: 'Leaks & Geeks',
        description: 'A known threat actor posts a sample of your user database on a dark web forum. SSNs included.',
        difficulty: 'MEDIUM',
        initialStepId: 'start',
        mitreTactics: ['TA0010', 'TA0009'],
        estimatedDuration: 6,
        category: 'GOVERNANCE',
        realWorldReference: 'Based on: Equifax Breach (2017)',
        steps: {
            'start': {
                id: 'start', title: 'The Forum Post',
                description: 'Intel team spots the post. 1000-record sample: emails, password hashes, SSNs. Threat actor says "full dump (50M records) available for 10 BTC."',
                choices: [
                    { id: 'l1', text: 'Public Disclosure Immediately', description: 'Notify all customers and press NOW.', risk: 'HIGH', cost: 100000, nextStepId: 'pr_storm', feedback: 'Transparent but premature. Was the sample even real? Stock drops 5%.', reputationImpact: -15 },
                    { id: 'l2', text: 'Verify Authenticity', description: 'Cross-reference sample with production DB.', risk: 'LOW', cost: 5000, nextStepId: 'verification', feedback: 'Prudent. Confirmed: data is from a 2-year-old test environment.' },
                    { id: 'l3', text: 'Engage Threat Intel Firm', description: 'Hire a dark web specialist to monitor and engage.', risk: 'MEDIUM', cost: 50000, nextStepId: 'intel', feedback: 'Professional approach. They identify the actor and assess the real risk.' }
                ]
            },
            'pr_storm': {
                id: 'pr_storm', title: 'Media Frenzy',
                description: 'Reporters camp in the lobby. You admitted a breach before confirming scope. Customers are panicking. Class-action lawyers are circling.',
                choices: [
                    { id: 'l4', text: 'Course Correct with Facts', description: 'Hold a press conference with forensic findings.', risk: 'MEDIUM', cost: 50000, nextStepId: 'notification', feedback: 'Damage control works partially. Trust is eroded.' },
                    { id: 'l5', text: 'Offer Free Credit Monitoring', description: 'Proactively protect affected users.', risk: 'LOW', cost: 500000, nextStepId: 'notification', feedback: 'Expensive but demonstrates good faith. Lawsuit risk reduced.' }
                ]
            },
            'verification': {
                id: 'verification', title: 'Scope Confirmed',
                description: 'Test DB from dev environment. 50K old records. No active production passwords. But SSNs are real — from an old migration script that should have been purged.',
                choices: [
                    { id: 'l6', text: 'Limited Notification', description: 'Email only the 50K affected users. No press.', risk: 'LOW', cost: 20000, nextStepId: 'remediation', feedback: 'Correct response. Regulatory fines minimal.' },
                    { id: 'l7', text: 'Full Transparency', description: 'Tell everyone anyway.', risk: 'LOW', cost: 50000, nextStepId: 'remediation', feedback: 'Honest but spooked the market for a non-critical issue.' },
                    { id: 'l8', text: 'Notify Regulators First', description: 'File with AG and FTC before customer notification.', risk: 'LOW', cost: 30000, nextStepId: 'notification', feedback: 'By-the-book approach. Regulators appreciate structured notification.' }
                ]
            },
            'intel': {
                id: 'intel', title: 'Threat Actor Profile',
                description: 'Dark web firm identifies actor as "GhostRat" — known for bluffing with partial data. 70% chance the "50M records" claim is fabricated.',
                choices: [
                    { id: 'l9', text: 'Call the Bluff', description: 'Ignore the extortion. Monitor for real leaks.', risk: 'MEDIUM', cost: 10000, nextStepId: 'verification', feedback: 'GhostRat moves on to easier targets. No full dump appears.' },
                    { id: 'l10', text: 'Take It Seriously Anyway', description: 'Assume worst case and begin notification.', risk: 'LOW', cost: 100000, nextStepId: 'notification', feedback: 'Cautious. Turns out the bluff was real — but you were ready either way.' }
                ]
            },
            'notification': {
                id: 'notification', title: 'Breach Notification',
                description: 'Legal confirms: GDPR (72hr), state breach laws (30-60 days), SEC (4 business days). Clock is ticking on all of them.',
                choices: [
                    { id: 'l11', text: 'Parallel Notifications', description: 'File all simultaneously with tailored messages.', risk: 'LOW', cost: 75000, nextStepId: 'remediation', feedback: 'Efficient. All deadlines met. Legal team impressed.' },
                    { id: 'l12', text: 'Prioritize GDPR (72hr)', description: 'Start with EU, then address US requirements.', risk: 'MEDIUM', cost: 50000, nextStepId: 'remediation', feedback: 'GDPR met but you nearly miss SEC deadline. Close call.' }
                ]
            },
            'remediation': {
                id: 'remediation', title: 'Hardening',
                description: 'Root cause: dev environment had production data with no masking. How do you prevent this from recurring?',
                choices: [
                    { id: 'l13', text: 'Full Data Classification Program', description: 'Classify all data, enforce masking, purge test DBs.', risk: 'LOW', cost: 200000, nextStepId: 'end_good', feedback: 'Comprehensive fix. No test environment ever holds real PII again.' },
                    { id: 'l14', text: 'Purge & Policy', description: 'Delete the old data, write a policy against it.', risk: 'MEDIUM', cost: 20000, nextStepId: 'end_neutral', feedback: 'Policy exists but enforcement is weak. Another dev copies production data next year.' },
                    { id: 'l15', text: 'Automated Data Masking Pipeline', description: 'Build a CI/CD step that auto-masks PII in test environments.', risk: 'LOW', cost: 100000, nextStepId: 'end_good', feedback: 'Technical solution that enforces the policy automatically. Best of both worlds.' }
                ]
            },
            'end_bad': { id: 'end_bad', title: 'GAME OVER: Regulatory Hell', description: 'Multiple fines, class-action lawsuits, CISO terminated.', choices: [], isEnding: true, scoreImpact: 10 },
            'end_neutral': { id: 'end_neutral', title: 'MISSION: Contained', description: 'Incident managed but systemic issues remain.', choices: [], isEnding: true, scoreImpact: 60 },
            'end_good': { id: 'end_good', title: 'MISSION: Crisis Managed', description: 'Surgical response. Data governance dramatically improved. Brand reputation intact.', choices: [], isEnding: true, scoreImpact: 95 }
        }
    },

    BCP: {
        id: 'BCP',
        title: 'Act of God',
        description: 'Category 4 Hurricane projected to hit your primary DC in Florida in 48 hours. DR plan untested.',
        difficulty: 'MEDIUM',
        initialStepId: 'start',
        mitreTactics: [],
        estimatedDuration: 6,
        category: 'GOVERNANCE',
        realWorldReference: 'Based on: Hurricane Maria DC Failures (2017)',
        steps: {
            'start': {
                id: 'start', title: 'The Forecast',
                description: 'NOAA: 80% direct hit probability. Diesel generators have 24h fuel. Roads close in 12h. Your DR site in Arizona was "tested" 18 months ago.',
                choices: [
                    { id: 'b1', text: 'Pre-emptive Failover', description: 'Shift all traffic to Arizona Hot Site NOW.', risk: 'MEDIUM', cost: 50000, nextStepId: 'failover_test', feedback: 'Smart early action, but the failover hasn\'t been tested recently...' },
                    { id: 'b2', text: 'Ride It Out', description: 'Trust the bunker construction and generators.', risk: 'HIGH', cost: 0, nextStepId: 'hurricane_hit', feedback: 'Roof held but fiber was cut by trees. You are offline.' },
                    { id: 'b3', text: 'Hybrid Approach', description: 'Fail over critical systems, keep non-critical in Florida.', risk: 'LOW', cost: 25000, nextStepId: 'failover_test', feedback: 'Balanced approach. Critical services protected, non-critical acceptable risk.' }
                ]
            },
            'failover_test': {
                id: 'failover_test', title: 'DR Site Issues',
                description: 'Arizona site is online but DB replication is 6 hours behind. Some configs are stale. Customer portal shows yesterday\'s data.',
                choices: [
                    { id: 'b4', text: 'Accept Data Lag', description: 'Communicate the lag, run with 6hr-old data.', risk: 'MEDIUM', cost: 5000, nextStepId: 'comms_plan', feedback: 'Customers can use the portal. Some transactions may need reconciliation.' },
                    { id: 'b5', text: 'Emergency DB Sync', description: 'Force a full sync before the storm hits.', risk: 'MEDIUM', cost: 20000, nextStepId: 'comms_plan', feedback: 'Sync completes 2 hours before landfall. Data is current.' },
                    { id: 'b6', text: 'Manual Fallback', description: 'Take portal offline, switch to phone/email support.', risk: 'HIGH', cost: 0, nextStepId: 'comms_plan', feedback: 'Support team overwhelmed. Customer satisfaction drops drastically.' }
                ]
            },
            'hurricane_hit': {
                id: 'hurricane_hit', title: 'Direct Hit',
                description: 'Fiber lines cut. Generators running but fuel truck can\'t get through flooded roads. You have 20 hours of fuel. Services degrading.',
                choices: [
                    { id: 'b7', text: 'Emergency Failover NOW', description: 'Switch to DR site under crisis conditions.', risk: 'HIGH', cost: 75000, nextStepId: 'emergency_failover', feedback: 'Failover under pressure. Some data loss. Some services don\'t come up cleanly.' },
                    { id: 'b8', text: 'Controlled Shutdown', description: 'Gracefully shut down before generators die.', risk: 'MEDIUM', cost: 10000, nextStepId: 'outage', feedback: 'Clean shutdown preserves data integrity but everything goes dark.' }
                ]
            },
            'emergency_failover': {
                id: 'emergency_failover', title: 'Chaotic Cutover',
                description: 'DR site partially online. Main app works but 3 microservices failed. Payment processing is down. Team is exhausted and working remotely.',
                choices: [
                    { id: 'b9', text: 'All-Hands War Room', description: 'Rally the team for a 12-hour fix sprint.', risk: 'MEDIUM', cost: 30000, nextStepId: 'comms_plan', feedback: 'Team delivers. All services restored in 8 hours. Heroic effort.' },
                    { id: 'b10', text: 'Partial Service Mode', description: 'Run what works, fix the rest tomorrow.', risk: 'LOW', cost: 5000, nextStepId: 'comms_plan', feedback: 'Core services up. Non-critical features degraded for 24 hours.' }
                ]
            },
            'outage': {
                id: 'outage', title: 'Total Blackout',
                description: 'You are offline for 3 days. Competitors offer "migration specials." Market share eroding. Board emergency session.',
                choices: [
                    { id: 'b11', text: 'Expedited Recovery', description: 'Charter flights for equipment and engineers.', risk: 'MEDIUM', cost: 200000, nextStepId: 'lessons', feedback: 'Back online in 4 days instead of 14. Expensive but necessary.' },
                    { id: 'b12', text: 'Wait for Infrastructure', description: 'Wait for roads and power to be restored.', risk: 'HIGH', cost: 0, nextStepId: 'end_bad', feedback: '14 days offline. 15% customer churn. CFO is discussing layoffs.' }
                ]
            },
            'comms_plan': {
                id: 'comms_plan', title: 'Customer Communication',
                description: 'Customers and partners are asking: "Will our data be safe?" and "When will services be fully restored?"',
                choices: [
                    { id: 'b13', text: 'Proactive Status Page', description: 'Real-time status page with ETAs and updates.', risk: 'LOW', cost: 5000, nextStepId: 'lessons', feedback: 'Customers love the transparency. Churn is minimal.', reputationImpact: 10 },
                    { id: 'b14', text: 'Email Blast', description: 'Mass email with generic reassurance.', risk: 'MEDIUM', cost: 1000, nextStepId: 'lessons', feedback: 'Impersonal. Some customers still worried.' },
                    { id: 'b15', text: 'Key Account Calls', description: 'Personally call top 20 customers.', risk: 'LOW', cost: 0, nextStepId: 'lessons', feedback: 'Top customers feel valued. Smaller customers feel ignored.' }
                ]
            },
            'lessons': {
                id: 'lessons', title: 'Lessons Learned',
                description: 'Storm has passed. Board wants a "Never Again" plan. Your DR process clearly had gaps.',
                choices: [
                    { id: 'b16', text: 'Multi-Region Active-Active', description: 'Invest in active-active across 3 regions.', risk: 'LOW', cost: 500000, nextStepId: 'end_good', feedback: 'No single point of failure. Next disaster is seamless. Gold standard.' },
                    { id: 'b17', text: 'Quarterly DR Testing', description: 'Test failover every quarter with game-day exercises.', risk: 'LOW', cost: 100000, nextStepId: 'end_good', feedback: 'Reasonable investment. DR is validated and team is practiced.' },
                    { id: 'b18', text: 'Update the Runbook', description: 'Document what went wrong, update procedures.', risk: 'MEDIUM', cost: 10000, nextStepId: 'end_neutral', feedback: 'Paper exercise. Without testing, the same thing will happen again.' }
                ]
            },
            'end_bad': { id: 'end_bad', title: 'GAME OVER: Business Devastated', description: '14 days offline. 15% customer churn. 3 executives resign. Acquisition rumors.', choices: [], isEnding: true, scoreImpact: 10 },
            'end_neutral': { id: 'end_neutral', title: 'MISSION: Survived', description: 'Business recovered but DR gaps remain. A ticking time bomb.', choices: [], isEnding: true, scoreImpact: 50 },
            'end_good': { id: 'end_good', title: 'MISSION: Resilient', description: 'Zero or minimal downtime. DR proven. Board impressed. Budget approved.', choices: [], isEnding: true, scoreImpact: 100 }
        }
    },

    BREACH: {
        id: 'BREACH',
        title: 'Red Alert: APT',
        description: 'Advanced Persistent Threat (APT29) detected with lateral movement in the Cardholder Data Environment.',
        difficulty: 'LETHAL',
        initialStepId: 'start',
        mitreTactics: ['TA0001', 'TA0002', 'TA0003', 'TA0004', 'TA0008', 'TA0011'],
        estimatedDuration: 10,
        category: 'TECHNICAL',
        realWorldReference: 'Based on: SolarWinds/APT29 (2020)',
        steps: {
            'start': {
                id: 'start', title: 'Contact Detected',
                description: 'EDR alerts: active shells on 3 CDE servers. Attacker is running Mimikatz. They are moving toward the primary database. Time is critical.',
                choices: [
                    { id: 'br1', text: 'Burn It Down', description: 'Disconnect internet. Rebuild CDE from scratch.', risk: 'HIGH', cost: 500000, nextStepId: 'scorched', feedback: 'Nuclear option. Theft stopped but business dead for a week.' },
                    { id: 'br2', text: 'Live Forensics', description: 'Watch them. Map their TTPs. Contain without tipping off.', risk: 'HIGH', cost: 100000, nextStepId: 'cat_mouse', feedback: 'Risky but you can learn their full infrastructure.' },
                    { id: 'br3', text: 'Targeted Containment', description: 'Isolate only the 3 compromised servers. Keep business running.', risk: 'MEDIUM', cost: 50000, nextStepId: 'cat_mouse', feedback: 'Surgical approach. But did you find all their footholds?' }
                ]
            },
            'scorched': {
                id: 'scorched', title: 'Pyrrhic Victory',
                description: 'CDE is offline. PCI assessor is asking questions. Customers cannot process cards. But the attacker is locked out.',
                choices: [
                    { id: 'br4', text: 'Fast Rebuild with Hardening', description: 'Rebuild CDE with zero trust, segmentation, fresh credentials.', risk: 'LOW', cost: 300000, nextStepId: 'threat_hunt', feedback: 'Clean environment. 5 days to rebuild but rock solid.' },
                    { id: 'br5', text: 'Restore from Last Known Good', description: 'Roll back to pre-compromise snapshot.', risk: 'HIGH', cost: 50000, nextStepId: 'persistence', feedback: 'Fast but the attacker may have backdoors in the "good" snapshot.' }
                ]
            },
            'cat_mouse': {
                id: 'cat_mouse', title: 'The Trap',
                description: 'You identified their C2 server and 2 backdoors. But forensics reveals a 3rd backdoor in a scheduled task. They had access for 6 weeks.',
                choices: [
                    { id: 'br6', text: 'Coordinated Takedown', description: 'Block all 3 backdoors simultaneously. Reset every credential.', risk: 'MEDIUM', cost: 75000, nextStepId: 'threat_hunt', feedback: 'Clean kill. All access revoked in 15 minutes.' },
                    { id: 'br7', text: 'Feed False Data', description: 'Let them think they still have access while you monitor.', risk: 'HIGH', cost: 25000, nextStepId: 'threat_hunt', feedback: 'Deception works. You identify their handlers and infrastructure.' },
                    { id: 'br8', text: 'Involve National CERT', description: 'Escalate to government cybersecurity agency.', risk: 'LOW', cost: 10000, nextStepId: 'threat_hunt', feedback: 'CERT confirms this is part of a larger campaign. You get classified intelligence.' }
                ]
            },
            'persistence': {
                id: 'persistence', title: 'They\'re Still Here',
                description: 'EDR triggers again 48 hours later. Same attacker, different backdoor. They had persistence in the "clean" backup.',
                choices: [
                    { id: 'br9', text: 'Full Rebuild (No Shortcuts)', description: 'Rebuild everything from source, not backups.', risk: 'LOW', cost: 500000, nextStepId: 'threat_hunt', feedback: 'Painful but necessary. This time it is truly clean.' },
                    { id: 'br10', text: 'Engage IR Firm', description: 'Bring in Mandiant/CrowdStrike for full sweep.', risk: 'LOW', cost: 400000, nextStepId: 'threat_hunt', feedback: 'Professionals find 2 more backdoors you missed. Money well spent.' }
                ]
            },
            'threat_hunt': {
                id: 'threat_hunt', title: 'Sweep & Clear',
                description: 'Environment stabilized. But was data exfiltrated? Network logs show 500GB of outbound traffic to an IP in Eastern Europe over the past 6 weeks.',
                choices: [
                    { id: 'br11', text: 'Assume Full Breach', description: 'Treat all CDE data as compromised. Begin PCI breach notification.', risk: 'LOW', cost: 200000, nextStepId: 'pci_response', feedback: 'Conservative but correct. PCI council appreciates quick action.' },
                    { id: 'br12', text: 'Analyze Exfiltrated Data', description: 'Determine exactly what was taken before notifying.', risk: 'MEDIUM', cost: 100000, nextStepId: 'pci_response', feedback: 'Analysis shows encrypted card data was taken but keys were separate. Silver lining.' },
                    { id: 'br13', text: 'Deny Exfiltration', description: 'Claim the traffic was normal. Avoid breach classification.', risk: 'HIGH', cost: 0, nextStepId: 'end_bad', feedback: 'PCI forensic investigator finds the evidence later. Now you face fraud charges.' }
                ]
            },
            'pci_response': {
                id: 'pci_response', title: 'PCI & Board Response',
                description: 'PCI Council demands a forensic investigation. Board wants heads to roll. Acquiring bank threatens to revoke processing privileges.',
                choices: [
                    { id: 'br14', text: 'Full Cooperation + Investment', description: 'PFI engagement, full remediation, $5M security investment.', risk: 'LOW', cost: 5000000, nextStepId: 'end_good', feedback: 'Expensive but you keep PCI compliance. New security posture is best-in-class.' },
                    { id: 'br15', text: 'Minimum Viable Compliance', description: 'Do the bare minimum to pass the PFI review.', risk: 'MEDIUM', cost: 500000, nextStepId: 'end_neutral', feedback: 'You pass but barely. Acquiring bank puts you on probation.' },
                    { id: 'br16', text: 'Switch Acquiring Bank', description: 'Find a more lenient processor.', risk: 'HIGH', cost: 100000, nextStepId: 'end_neutral', feedback: 'New bank charges higher rates. Reputation follows you.' }
                ]
            },
            'end_bad': { id: 'end_bad', title: 'GAME OVER: Criminal Liability', description: 'Cover-up discovered. CISO faces fraud charges. Company fined $20M.', choices: [], isEnding: true, scoreImpact: 5 },
            'end_neutral': { id: 'end_neutral', title: 'MISSION: Costly Survival', description: 'Breach contained but response was suboptimal. Probation and increased scrutiny.', choices: [], isEnding: true, scoreImpact: 45 },
            'end_good': { id: 'end_good', title: 'MISSION: Threat Neutralized', description: 'APT evicted. Zero data loss confirmed. World-class remediation. PCI compliance strengthened.', choices: [], isEnding: true, scoreImpact: 100 }
        }
    },

    SUPPLY_CHAIN: {
        id: 'SUPPLY_CHAIN',
        title: 'Trojan Update',
        description: 'Your primary monitoring tool pushes a malicious update. 15,000 companies affected. You are one of them.',
        difficulty: 'LETHAL',
        initialStepId: 'start',
        mitreTactics: ['TA0001', 'TA0002', 'TA0003', 'TA0005'],
        estimatedDuration: 10,
        category: 'TECHNICAL',
        realWorldReference: 'Based on: SolarWinds SUNBURST (2020)',
        steps: {
            'start': {
                id: 'start', title: 'The Vendor Advisory',
                description: 'Your monitoring vendor (NetMonitor Pro) sends an urgent advisory: "Routine update v3.2.1 contained unauthorized code." You auto-deployed it 72 hours ago.',
                choices: [
                    { id: 'sc1', text: 'Isolate All NetMonitor Servers', description: 'Kill network access to every NetMonitor instance.', risk: 'MEDIUM', cost: 25000, nextStepId: 'assess', feedback: 'Good first step. Monitoring is blind but the backdoor is contained.' },
                    { id: 'sc2', text: 'Rollback to v3.1.9', description: 'Downgrade all instances to the previous clean version.', risk: 'LOW', cost: 10000, nextStepId: 'assess', feedback: 'Clean version restored. But did the malicious code already execute?' },
                    { id: 'sc3', text: 'Wait for Vendor IOCs', description: 'Ask vendor for indicators of compromise before acting.', risk: 'HIGH', cost: 0, nextStepId: 'spreading', feedback: 'Vendor takes 6 hours to respond. Backdoor was active this entire time.' }
                ]
            },
            'spreading': {
                id: 'spreading', title: 'Active Exploitation',
                description: 'The backdoor phoned home. Attacker has a shell on your NetMonitor server — which has read access to logs from EVERY system in your network.',
                choices: [
                    { id: 'sc4', text: 'Emergency Isolation', description: 'Finally isolate NetMonitor. Begin damage assessment.', risk: 'MEDIUM', cost: 50000, nextStepId: 'assess', feedback: 'Late but necessary. 6 hours of attacker access means credentials may be compromised.' },
                    { id: 'sc5', text: 'Full Network Reset', description: 'Reset all credentials across the entire environment.', risk: 'HIGH', cost: 200000, nextStepId: 'vendor_mgmt', feedback: 'Disruptive but effective. Every password, API key, and token is rotated.' }
                ]
            },
            'assess': {
                id: 'assess', title: 'Damage Assessment',
                description: 'Forensics: backdoor ran a credential harvester. It collected service account passwords from log data. 47 service accounts potentially compromised.',
                choices: [
                    { id: 'sc6', text: 'Targeted Credential Reset', description: 'Reset only the 47 identified service accounts.', risk: 'MEDIUM', cost: 25000, nextStepId: 'vendor_mgmt', feedback: 'Efficient but risky. What if the harvester collected more than you found?' },
                    { id: 'sc7', text: 'Full Credential Rotation', description: 'Reset EVERY credential in the environment.', risk: 'LOW', cost: 150000, nextStepId: 'vendor_mgmt', feedback: 'Disruptive but thorough. No credential is left potentially compromised.' },
                    { id: 'sc8', text: 'Monitor for Misuse', description: 'Watch the 47 accounts for suspicious activity.', risk: 'HIGH', cost: 5000, nextStepId: 'vendor_mgmt', feedback: 'You catch 2 accounts being used maliciously. But what about the ones you missed?' }
                ]
            },
            'vendor_mgmt': {
                id: 'vendor_mgmt', title: 'Vendor Accountability',
                description: 'NetMonitor CEO is on TV: "Only a small number of customers were targeted." Your CISO senses are tingling — you WERE targeted.',
                choices: [
                    { id: 'sc9', text: 'Demand Full Forensic Report', description: 'Invoke contract clause requiring vendor transparency.', risk: 'LOW', cost: 0, nextStepId: 'replace_vendor', feedback: 'Vendor provides report. Your org was specifically targeted. They knew.' },
                    { id: 'sc10', text: 'Terminate Vendor Immediately', description: 'Remove NetMonitor entirely. Find alternative.', risk: 'MEDIUM', cost: 100000, nextStepId: 'replace_vendor', feedback: 'Clean break. Monitoring gaps for 2 weeks during transition.' },
                    { id: 'sc11', text: 'Stay with Vendor', description: 'Accept their assurances and continue the relationship.', risk: 'HIGH', cost: 0, nextStepId: 'hardening', feedback: 'Board later discovers you stayed with a compromised vendor. Not a good look.' }
                ]
            },
            'replace_vendor': {
                id: 'replace_vendor', title: 'Vendor Replacement',
                description: 'You need monitoring back online. Two options: an open-source stack (Grafana/Prometheus) or another commercial tool.',
                choices: [
                    { id: 'sc12', text: 'Open Source Stack', description: 'Full control. No vendor trust required.', risk: 'MEDIUM', cost: 75000, nextStepId: 'hardening', feedback: 'Takes 3 weeks but you own every line of code.' },
                    { id: 'sc13', text: 'New Commercial Vendor', description: 'Faster deployment but same trust model.', risk: 'MEDIUM', cost: 150000, nextStepId: 'hardening', feedback: 'Up in 5 days. But did you learn the lesson about vendor trust?' }
                ]
            },
            'hardening': {
                id: 'hardening', title: 'Supply Chain Security',
                description: 'Board asks: "How do we prevent a supply chain attack from happening again?"',
                choices: [
                    { id: 'sc14', text: 'Full SBOM + Vendor Security Program', description: 'Software Bill of Materials, vendor assessments, update sandboxing.', risk: 'LOW', cost: 300000, nextStepId: 'end_good', feedback: 'Gold standard. Every vendor update is sandboxed and validated before production.' },
                    { id: 'sc15', text: 'Update Staging Environment', description: 'Test all vendor updates in staging for 72hr before production.', risk: 'LOW', cost: 50000, nextStepId: 'end_good', feedback: 'Simple but effective. Catches most supply chain attacks.' },
                    { id: 'sc16', text: 'Hope It Doesn\'t Happen Again', description: 'No structural changes.', risk: 'HIGH', cost: 0, nextStepId: 'end_neutral', feedback: 'It will happen again. It is only a matter of time.' }
                ]
            },
            'end_bad': { id: 'end_bad', title: 'GAME OVER: Total Compromise', description: 'Attacker maintained access for months. Full data breach. Multiple lawsuits.', choices: [], isEnding: true, scoreImpact: 10 },
            'end_neutral': { id: 'end_neutral', title: 'MISSION: Survived', description: 'Immediate threat contained but supply chain posture unchanged.', choices: [], isEnding: true, scoreImpact: 50 },
            'end_good': { id: 'end_good', title: 'MISSION: Resilient', description: 'Supply chain attack contained. Vendor accountability enforced. Prevention deployed.', choices: [], isEnding: true, scoreImpact: 100 }
        }
    },

    ZERO_DAY: {
        id: 'ZERO_DAY',
        title: 'Friday at Five',
        description: 'Critical zero-day CVE drops Friday 5pm. Your edge firewalls are vulnerable. No patch exists. Exploit is public.',
        difficulty: 'HARD',
        initialStepId: 'start',
        mitreTactics: ['TA0001', 'TA0002', 'TA0042'],
        estimatedDuration: 6,
        category: 'TECHNICAL',
        realWorldReference: 'Based on: Log4Shell CVE-2021-44228',
        steps: {
            'start': {
                id: 'start', title: 'CVE-2024-CRITICAL',
                description: 'Friday 5:00 PM. CISA emergency alert: RCE in FortiGate firewalls. CVSS 10.0. Exploit code on GitHub. You have 1,200 FortiGate devices. No patch yet.',
                choices: [
                    { id: 'z1', text: 'Emergency WAF Rules', description: 'Deploy virtual patching rules to block the exploit pattern.', risk: 'MEDIUM', cost: 10000, nextStepId: 'scanning', feedback: 'Buys time but sophisticated variants may bypass pattern matching.' },
                    { id: 'z2', text: 'Disable Vulnerable Service', description: 'Turn off the affected service on all firewalls.', risk: 'HIGH', cost: 0, nextStepId: 'service_impact', feedback: 'Exploit vectors closed but VPN users can\'t connect. Remote workers stranded.' },
                    { id: 'z3', text: 'Assess & Prioritize', description: 'Inventory which devices face the internet. Patch internet-facing first.', risk: 'LOW', cost: 5000, nextStepId: 'scanning', feedback: 'Smart approach. 200 internet-facing devices prioritized. 1000 internal lower risk.' }
                ]
            },
            'service_impact': {
                id: 'service_impact', title: 'Business Impact',
                description: 'VPN is down. 3,000 remote workers cannot access internal systems. Customer support is crippled. CEO: "Fix this NOW."',
                choices: [
                    { id: 'z4', text: 'Alternative Access', description: 'Stand up emergency Cloudflare Access / ZTNA tunnel.', risk: 'LOW', cost: 50000, nextStepId: 'scanning', feedback: 'Workers back online in 2 hours via zero trust tunnel. Elegant solution.' },
                    { id: 'z5', text: 'Re-enable with Monitoring', description: 'Turn VPN back on with intense monitoring.', risk: 'HIGH', cost: 0, nextStepId: 'scanning', feedback: 'Workers online but you know the exploit is public. Every second is risk.' }
                ]
            },
            'scanning': {
                id: 'scanning', title: 'Scanning for Compromise',
                description: 'You run IOC checks. 3 of your internet-facing firewalls show signs of exploitation. Webshells detected. Attacker had access for 4 hours.',
                choices: [
                    { id: 'z6', text: 'Isolate & Reimage', description: 'Take the 3 devices offline, rebuild from factory.', risk: 'LOW', cost: 30000, nextStepId: 'patch_sprint', feedback: 'Clean devices back online in 6 hours. Attacker evicted.' },
                    { id: 'z7', text: 'Forensics First', description: 'Preserve evidence before wiping. Understand attacker actions.', risk: 'MEDIUM', cost: 50000, nextStepId: 'patch_sprint', feedback: 'Forensics reveals attacker only planted webshells. No lateral movement yet.' },
                    { id: 'z8', text: 'Patch When Available', description: 'Wait for the official patch and apply it.', risk: 'HIGH', cost: 0, nextStepId: 'deeper_compromise', feedback: 'Patch arrives Monday. Attacker has the entire weekend. They pivot internally.' }
                ]
            },
            'deeper_compromise': {
                id: 'deeper_compromise', title: 'Weekend Breach',
                description: 'Monday morning: attacker used the weekend to move laterally. They now have domain admin credentials. Full network compromise.',
                choices: [
                    { id: 'z9', text: 'Full IR Engagement', description: 'Bring in Mandiant. Full incident response.', risk: 'LOW', cost: 500000, nextStepId: 'patch_sprint', feedback: 'Expensive but necessary. Full remediation takes 2 weeks.' },
                    { id: 'z10', text: 'Internal Response', description: 'Handle it internally to save costs.', risk: 'HIGH', cost: 50000, nextStepId: 'end_bad', feedback: 'Your team is overwhelmed. Attacker maintains persistence for months.' }
                ]
            },
            'patch_sprint': {
                id: 'patch_sprint', title: 'Patch Sprint',
                description: 'Vendor releases emergency patch Saturday morning. You have 1,200 devices to patch. Team is exhausted from the Friday night response.',
                choices: [
                    { id: 'z11', text: 'Automated Mass Deployment', description: 'Push patch to all 1,200 devices simultaneously via automation.', risk: 'MEDIUM', cost: 10000, nextStepId: 'after_action', feedback: 'Fast but 12 devices bricked by bad patch interaction. Worth it.' },
                    { id: 'z12', text: 'Phased Rollout', description: 'Test on 50 devices, then deploy in waves.', risk: 'LOW', cost: 5000, nextStepId: 'after_action', feedback: 'Slower but no bricked devices. Full deployment by Sunday night.' },
                    { id: 'z13', text: 'Outsource to MSP', description: 'Pay your managed service provider overtime to handle it.', risk: 'LOW', cost: 75000, nextStepId: 'after_action', feedback: 'Team rests while MSP handles patching. All done by Sunday.' }
                ]
            },
            'after_action': {
                id: 'after_action', title: 'Monday Morning',
                description: 'Crisis over. Board asks: "Why were we vulnerable to a zero-day?" How do you prevent this scenario?',
                choices: [
                    { id: 'z14', text: 'Zero-Day Response Playbook', description: 'Documented playbook, pre-approved emergency change windows, vendor diversification.', risk: 'LOW', cost: 50000, nextStepId: 'end_good', feedback: 'Next zero-day is handled in 2 hours instead of 2 days.' },
                    { id: 'z15', text: 'Vendor Diversification', description: 'Replace single-vendor dependency with multi-vendor approach.', risk: 'MEDIUM', cost: 200000, nextStepId: 'end_good', feedback: 'No single vendor zero-day can take down the entire perimeter.' },
                    { id: 'z16', text: 'Accept the Risk', description: '"Zero-days are unpredictable. We handled it."', risk: 'HIGH', cost: 0, nextStepId: 'end_neutral', feedback: 'Board is unimpressed with the lack of improvement plan.' }
                ]
            },
            'end_bad': { id: 'end_bad', title: 'GAME OVER: Persistent Compromise', description: 'Attacker entrenched during the weekend. Full network breach. Months of remediation.', choices: [], isEnding: true, scoreImpact: 10 },
            'end_neutral': { id: 'end_neutral', title: 'MISSION: Survived', description: 'Zero-day handled but no improvements made. You got lucky this time.', choices: [], isEnding: true, scoreImpact: 55 },
            'end_good': { id: 'end_good', title: 'MISSION: Rapid Response', description: 'Zero-day contained within hours. Patch deployed. Playbook created for future incidents.', choices: [], isEnding: true, scoreImpact: 100 }
        }
    },

    CLOUD_MISCONFIG: {
        id: 'CLOUD_MISCONFIG',
        title: 'Open Bucket',
        description: 'Security researcher tweets: "Found an open S3 bucket with PII from @YourCompany. 2M customer records exposed."',
        difficulty: 'MEDIUM',
        initialStepId: 'start',
        mitreTactics: ['TA0009', 'TA0010'],
        estimatedDuration: 5,
        category: 'GOVERNANCE',
        realWorldReference: 'Based on: Capital One S3 Breach (2019)',
        steps: {
            'start': {
                id: 'start', title: 'The Tweet',
                description: 'Saturday 9 AM. A well-known security researcher tweets a screenshot of your S3 bucket contents. File names clearly show PII. 2,000 retweets in 30 minutes.',
                choices: [
                    { id: 'cm1', text: 'Lock the Bucket Immediately', description: 'Set bucket ACL to private. Block all public access.', risk: 'LOW', cost: 0, nextStepId: 'assess_damage', feedback: 'Bucket locked in 3 minutes. But the data was public for how long?' },
                    { id: 'cm2', text: 'Contact Researcher First', description: 'DM the researcher to coordinate responsible disclosure.', risk: 'MEDIUM', cost: 0, nextStepId: 'researcher_engage', feedback: 'Researcher is cooperative but won\'t delete the tweet. More exposure.' },
                    { id: 'cm3', text: 'Delete the Bucket Entirely', description: 'Nuke the entire bucket to remove access.', risk: 'HIGH', cost: 0, nextStepId: 'data_loss', feedback: 'Public access stopped but you also deleted the only copy of that data.' }
                ]
            },
            'researcher_engage': {
                id: 'researcher_engage', title: 'Responsible Disclosure',
                description: 'Researcher says: "I found this 3 days ago and emailed security@ — no response. I went public because you ignored me."',
                choices: [
                    { id: 'cm4', text: 'Apologize & Cooperate', description: 'Thank them, lock the bucket, ask for a coordinated timeline.', risk: 'LOW', cost: 5000, nextStepId: 'assess_damage', feedback: 'Researcher tweets: "Good response from @YourCompany. Bucket secured."', reputationImpact: 5 },
                    { id: 'cm5', text: 'Legal Threats', description: 'Have legal send a CFAA cease-and-desist.', risk: 'HIGH', cost: 10000, nextStepId: 'pr_disaster', feedback: 'Researcher publishes your legal threat. Internet is furious. #DeleteYourCompany trends.' }
                ]
            },
            'data_loss': {
                id: 'data_loss', title: 'Data Recovery Crisis',
                description: 'The deleted bucket contained backup invoices and customer contracts. Finance team is panicking. Legal says those records have retention requirements.',
                choices: [
                    { id: 'cm6', text: 'Recover from Versioning', description: 'Check if S3 versioning was enabled.', risk: 'LOW', cost: 1000, nextStepId: 'assess_damage', feedback: 'Versioning was on! Data recovered. Lucky break.' },
                    { id: 'cm7', text: 'Reconstruct from Backups', description: 'Pull data from last backup.', risk: 'MEDIUM', cost: 20000, nextStepId: 'assess_damage', feedback: 'Some data is 30 days old but most is recovered.' }
                ]
            },
            'pr_disaster': {
                id: 'pr_disaster', title: 'Streisand Effect',
                description: 'Your legal threats backfired. Dozens of researchers are now scanning your infrastructure. 3 more misconfigurations found.',
                choices: [
                    { id: 'cm8', text: 'Public Apology + Bug Bounty', description: 'Apologize publicly, launch a bug bounty program.', risk: 'LOW', cost: 100000, nextStepId: 'assess_damage', feedback: 'Community anger subsides. Bug bounty finds 15 more issues. Net positive.' },
                    { id: 'cm9', text: 'Go Silent', description: 'Stop engaging. Let it blow over.', risk: 'MEDIUM', cost: 0, nextStepId: 'end_bad', feedback: 'It doesn\'t blow over. Media coverage intensifies. Customer churn spikes.' }
                ]
            },
            'assess_damage': {
                id: 'assess_damage', title: 'Exposure Assessment',
                description: 'CloudTrail logs show the bucket was public for 8 months. 47 unique IPs accessed it. 2.1M records with names, emails, phone numbers, and partial SSNs.',
                choices: [
                    { id: 'cm10', text: 'Full Breach Notification', description: 'Notify all 2.1M affected users, regulators, and offer credit monitoring.', risk: 'LOW', cost: 2000000, nextStepId: 'remediation', feedback: 'Expensive but legally correct. Class-action risk minimized.', reputationImpact: -10 },
                    { id: 'cm11', text: 'Risk-Based Notification', description: 'Notify only the 500K users whose SSNs were exposed.', risk: 'MEDIUM', cost: 500000, nextStepId: 'remediation', feedback: 'Legally defensible. But if the full list leaks, you face backlash.' },
                    { id: 'cm12', text: 'Delay Notification', description: 'Wait 30 days to "complete the investigation."', risk: 'HIGH', cost: 0, nextStepId: 'remediation', feedback: 'Multiple states have 72-hour notification requirements. You are now non-compliant.' }
                ]
            },
            'remediation': {
                id: 'remediation', title: 'Cloud Security Overhaul',
                description: 'Root cause: no CSPM tool, no guardrails, developers had direct S3 access with no policy enforcement.',
                choices: [
                    { id: 'cm13', text: 'Full CSPM + IaC Guardrails', description: 'Deploy Prisma Cloud / Wiz + Terraform policies. Block public buckets at the org level.', risk: 'LOW', cost: 200000, nextStepId: 'end_good', feedback: 'No public bucket can ever be created again. Engineers use approved templates.' },
                    { id: 'cm14', text: 'AWS Organization SCPs', description: 'Service Control Policies to block public access at the AWS account level.', risk: 'LOW', cost: 20000, nextStepId: 'end_good', feedback: 'Simple, effective, free (minus labor). Should have been there from day one.' },
                    { id: 'cm15', text: 'Developer Training', description: 'Mandatory cloud security training for all engineers.', risk: 'MEDIUM', cost: 30000, nextStepId: 'end_neutral', feedback: 'Good for culture but doesn\'t prevent the NEXT misconfiguration.' }
                ]
            },
            'end_bad': { id: 'end_bad', title: 'GAME OVER: Brand Destroyed', description: 'Extended exposure + hostile researcher relations. Regulatory fines + customer churn.', choices: [], isEnding: true, scoreImpact: 10 },
            'end_neutral': { id: 'end_neutral', title: 'MISSION: Patched', description: 'Exposure stopped but no systemic prevention. Another bucket will be exposed eventually.', choices: [], isEnding: true, scoreImpact: 55 },
            'end_good': { id: 'end_good', title: 'MISSION: Cloud Secured', description: 'Bucket closed. Notifications sent. Automated guardrails prevent recurrence. Best-practice response.', choices: [], isEnding: true, scoreImpact: 100 }
        }
    },

    PHISHING: {
        id: 'PHISHING',
        title: 'Whale Hunt',
        description: 'CEO receives a convincing spear-phishing email from a "board member." CFO wires $2.3M before anyone notices.',
        difficulty: 'EASY',
        initialStepId: 'start',
        mitreTactics: ['TA0001', 'TA0043', 'TA0009'],
        estimatedDuration: 5,
        category: 'HYBRID',
        realWorldReference: 'Based on: Ubiquiti BEC ($46.7M, 2015)',
        steps: {
            'start': {
                id: 'start', title: 'The Wire',
                description: 'Monday 10 AM. Controller calls you: "The CEO authorized a $2.3M wire to a new vendor last Friday. But the CEO says he never sent that email."',
                choices: [
                    { id: 'p1', text: 'Contact the Bank Immediately', description: 'Call the bank to freeze/recall the wire transfer.', risk: 'LOW', cost: 5000, nextStepId: 'bank_response', feedback: 'Critical first move. Speed matters — wire recalls have a 24-48hr window.' },
                    { id: 'p2', text: 'Investigate the Email First', description: 'Analyze the phishing email headers and origin.', risk: 'MEDIUM', cost: 0, nextStepId: 'email_analysis', feedback: 'Good for the investigation but every hour reduces the chance of recall.' },
                    { id: 'p3', text: 'Confront the CFO', description: 'Find out how this bypassed financial controls.', risk: 'HIGH', cost: 0, nextStepId: 'control_failure', feedback: 'CFO is defensive: "The email looked totally real and referenced our board meeting."' }
                ]
            },
            'bank_response': {
                id: 'bank_response', title: 'Wire Recall',
                description: 'Bank initiates a recall. $1.8M of the $2.3M was already forwarded to an account in Singapore. They can freeze $500K.',
                choices: [
                    { id: 'p4', text: 'File FBI IC3 Report', description: 'Engage law enforcement for international recovery.', risk: 'LOW', cost: 10000, nextStepId: 'email_analysis', feedback: 'FBI coordinates with Singapore authorities. Recovery is slow but possible.' },
                    { id: 'p5', text: 'Engage Cyber Insurance', description: 'File a claim under your social engineering policy.', risk: 'LOW', cost: 0, nextStepId: 'email_analysis', feedback: 'Policy covers up to $2M in BEC losses. Claim process takes 60 days.' },
                    { id: 'p6', text: 'Accept the Loss', description: 'Write off the unrecoverable amount.', risk: 'HIGH', cost: 1800000, nextStepId: 'email_analysis', feedback: 'Board is furious. $1.8M write-off with no attempt at recovery.' }
                ]
            },
            'email_analysis': {
                id: 'email_analysis', title: 'The Forensics',
                description: 'Phishing email came from a lookalike domain (ceo@yourcompany.co vs .com). Attacker researched the CEO\'s schedule from LinkedIn and referenced a real board meeting.',
                choices: [
                    { id: 'p7', text: 'DMARC + Lookalike Monitoring', description: 'Enforce DMARC reject, register defensive domains.', risk: 'LOW', cost: 15000, nextStepId: 'control_failure', feedback: 'Excellent. No lookalike domain email will reach your org again.' },
                    { id: 'p8', text: 'Block the Domain', description: 'Block yourcompany.co at the email gateway.', risk: 'LOW', cost: 0, nextStepId: 'control_failure', feedback: 'Blocks this specific domain but the attacker registers another tomorrow.' },
                    { id: 'p9', text: 'Executive Threat Briefing', description: 'Brief all C-suite on BEC tactics and social media OPSEC.', risk: 'LOW', cost: 5000, nextStepId: 'control_failure', feedback: 'Executives now scrub LinkedIn of sensitive scheduling info.' }
                ]
            },
            'control_failure': {
                id: 'control_failure', title: 'The Process Gap',
                description: 'Root cause: no dual-authorization for wire transfers > $100K. CFO had single-signer authority. No callback verification was required.',
                choices: [
                    { id: 'p10', text: 'Dual Authorization + Callback', description: 'Require 2 signers and phone callback for all wires > $50K.', risk: 'LOW', cost: 5000, nextStepId: 'training', feedback: 'Simple, effective. The next BEC attempt fails at verification.' },
                    { id: 'p11', text: 'Full BEC Prevention Program', description: 'Dual auth + AI email analysis + vendor verification + training.', risk: 'LOW', cost: 50000, nextStepId: 'training', feedback: 'Comprehensive approach. Multiple layers of defense.' },
                    { id: 'p12', text: 'Policy Update Only', description: 'Write a new wire transfer policy. No technical controls.', risk: 'HIGH', cost: 1000, nextStepId: 'training', feedback: 'Policy without enforcement is a suggestion, not a control.' }
                ]
            },
            'training': {
                id: 'training', title: 'Culture Change',
                description: 'Board asks: "How do we prevent employees from falling for phishing?" Currently there is no security awareness training program.',
                choices: [
                    { id: 'p13', text: 'Simulated Phishing + Training Platform', description: 'Monthly phishing simulations with training for failures. KnowBe4/Proofpoint.', risk: 'LOW', cost: 50000, nextStepId: 'end_good', feedback: 'Phishing click rates drop from 30% to 3% in 6 months. Measurable improvement.' },
                    { id: 'p14', text: 'Annual Compliance Training', description: 'One mandatory training session per year.', risk: 'MEDIUM', cost: 10000, nextStepId: 'end_neutral', feedback: 'Checkbox compliance. Click rates drop slightly but plateau at 15%.' },
                    { id: 'p15', text: 'Self-Service Resources', description: 'Post training videos on the intranet. Trust people to watch them.', risk: 'HIGH', cost: 2000, nextStepId: 'end_neutral', feedback: 'Nobody watches the videos. Click rates unchanged.' }
                ]
            },
            'end_bad': { id: 'end_bad', title: 'GAME OVER: Unrecoverable Loss', description: '$2.3M lost. No insurance. No controls. Board votes no confidence in CISO.', choices: [], isEnding: true, scoreImpact: 10 },
            'end_neutral': { id: 'end_neutral', title: 'MISSION: Partial Recovery', description: 'Some money recovered. Basic controls added. But phishing defense is still weak.', choices: [], isEnding: true, scoreImpact: 55 },
            'end_good': { id: 'end_good', title: 'MISSION: Resilient', description: 'Maximum recovery achieved. BEC controls deployed. Phishing training effective. Culture shifted.', choices: [], isEnding: true, scoreImpact: 100 }
        }
    },
};
