# Astra CISO Platform - User Guide

Welcome to the Astra CISO platform, your comprehensive AI-powered command center for cybersecurity governance, operations, and incident response.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Command Center](#command-center)
3. [SecOps Center](#secops-center)
4. [Incident Response (War Room)](#incident-response-war-room)
5. [Threat Modeling](#threat-modeling)
6. [Governance, Risk, and Compliance](#governance-risk-and-compliance)
7. [Reporting](#reporting)
8. [Settings & Configuration](#settings--configuration)

---

## Getting Started

### Access

Navigate to the platform URL and log in with your credentials. Upon login, you will be directed to the **Command Center**.

### Navigation

The sidebar on the left provides access to all modules.

- **Collapsed Mode**: Click the chevron at the bottom of the sidebar to collapse it for more screen space. Icons will show tooltips on hover.
- **Theme**: Toggle between Light and Dark mode using the sun/moon icon in the top right header.

---

## Command Center

**URL:** `/`

The Command Center is your daily operational dashboard.

- **Key Metrics**: View real-time scores for Security, Compliance, and Risk.
- **Quick Actions**: One-click access to start a scan, draft a policy, or enter the War Room.
- **System Status**: Monitor the overall health of your security infrastructure.

---

## SecOps Center

**URL:** `/secops`

Monitor your security operations in real-time.

### CI/CD Pipelines

- View the security status of your build pipelines.
- **Security Gates**: Check passing/failing status for SAST, DAST, Container Scans, and Secret detection.
- **Pipeline Health**: Monitor build times and success rates.

### Cloud Security Posture

- Supported Providers: AWS, Azure, GCP.
- View compliance scores per cloud account.
- Identify misconfigurations and critical risks.

### Findings

- A prioritized list of vulnerabilities needing attention.
- Filter by severity (Critical, High, Medium, Low).

---

## Incident Response (War Room)

**URL:** `/incidents/war-room`

The centralized hub for managing active security incidents.

### AI Copilot

- **Chat Interface**: Interact with the AI Incident Commander for guidance.
- **Capabilities**: Ask for analysis, containment strategies, or communication drafts.
- **Context-Aware**: The AI knows about your affected systems and active playbooks.

### Response Tools

- **Response Playbook**: Follow a dynamic checklist based on the incident type (e.g., Ransomware, DDoS).
- **Affected Systems**: Track the status of compromised assets. **Isolate** systems directly from the UI.
- **Quick Actions**: One-click triggers for IOC scans, timeline generation, and stakeholder notifications.

---

## Threat Modeling

**URL:** `/threat-modeling`

Design secure architectures and identify risks early.

### Architecture Designer

1. **Add Components**: Drag and drop Web Apps, APIs, Databases, etc.
2. **Define Flows**: Connect components to visualize data movement.
3. **Configure Trust**: Set trust levels (Trusted, DMZ, Untrusted) and protocols (HTTPS, SQL, etc.).

### STRIDE Analysis

- Click **"Run STRIDE Analysis"** to let the engine evaluate your design.
- **Results**: View identified threats categorized by STRIDE (Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation of Privilege).
- **Risk Score**: Each threat is assigned a risk score (1-10).
- **Mitigation**: Get specific, actionable recommendations to fix each issue.

### Templates

- Start quickly by loading a template (e.g., "Web + API Architecture", "Microservices").

---

## Governance, Risk, and Compliance

### Policy Engine (`/policies`)

- **AI Auto-Draft**: Generate policy drafts based on simple prompts using the OpenClaw engine.
- **Policy Library**: Manage policies for Access Control, Data Protection, etc.
- **Editor**: Full rich-text editor for refining policy documents.

### Compliance Heatmap (`/governance`)

- Visualize your compliance posture against frameworks like ISO 27001 and SOC 2.
- **Real-time Monitoring**: Cells update based on live control checks.

---

## Reporting

**URL:** `/reporting`

Generate professional documentation for stakeholders.

### Available Templates

- **Executive Summary**: High-level overview for C-suite/Board.
- **Compliance Report**: Detailed audit evidence for ISO/SOC 2.
- **Incident Report**: Post-mortem analysis.
- **Wargame Report**: Results from simulation exercises.
- **Risk Assessment**: Detailed risk register.

### Exporting

1. Select a template.
2. Configure the date range and report name.
3. Click **"Generate PDF"** to download.

---

## Settings & Configuration

**URL:** `/settings`

### AI Intelligence

- **Provider Selection**: Choose between internal Mock provider, OpenAI, Anthropic, or Google Gemini.
- **API Keys**: Securely enter your API keys (stored locally/server-side, never exposed to client).
- **Connection Test**: Verify connectivity to your chosen AI provider.

### Preferences

- **Appearance**: Customize the theme (System, Light, Dark).
- **Notifications**: Configure alert preferences for incidents and scans.
