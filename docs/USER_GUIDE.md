# Astra CISO Platform - User Guide

Welcome to the Astra CISO platform, your comprehensive AI-powered command center for cybersecurity governance, operations, and incident response.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Command Center](#command-center)
3. [Nexus Graph](#nexus-graph)
4. [SecOps Center](#secops-center)
5. [Incident Response (War Room)](#incident-response-war-room)
6. [Threat Modeling](#threat-modeling)
7. [Governance & Policy Engine](#governance--policy-engine)
8. [Settings & AI Configuration](#settings--ai-configuration)

---

## Getting Started

### Access

Navigate to the platform URL and log in. Upon login, you will be directed to the **Command Center**.

### Navigation

The sidebar on the left provides access to all modules.

- **Collapsed Mode**: Click the chevron at the bottom of the sidebar to collapse it.
- **Demon Mode**: A special "Silent Mode" for immersion (toggle via the eye icon).

---

## Command Center

**URL:** `/`

Your daily operational dashboard featuring:

- **Key Metrics**: Real-time scores for Security, Compliance, and Risk.
- **Global Threat Pulse**: A ticker showing federated threat intelligence and sector immunity scores.

---

## Nexus Graph

**URL:** `/nexus`

A physics-based visualization of your organization's digital topology.

- **Nodes**: Represents Business Units, Applications, and Infrastructure.
- **Links**: Shows logical dependencies and data flows.
- **Risk Visualization**: Critical risks (like CVEs) cause nodes to pulse red.
- **Drill Down**: Click any node to see detailed metrics (throughput, active threats, legal violations).

---

## SecOps Center

**URL:** `/secops`

Monitor your security operations and CI/CD health.

- **Pipeline Security**: Track scan status (SAST/DAST) for builds.
- **Cloud Posture**: View compliance scores for AWS/Azure/GCP accounts.
- **Findings**: Prioritized list of vulnerabilities.

---

## Incident Response (War Room)

**URL:** `/incidents/war-room`

The centralized hub for managing active security incidents.

### AI Copilot

Interact with the **AI Incident Commander** via a chat interface. It acts as an expert consultant for containment strategies and communication drafts.

### Features

- **Secure Comms**: Encrypted channel for the crisis team.
- **Active Defense**: Deploy countermeasures (e.g., Firewall blocks, User containment).

---

## Threat Modeling

**URL:** `/threat-modeling`

Design secure architectures and identify risks early using the **STRIDE** methodology.

1. **Designer**: Drag and drop components (Web App, API, DB).
2. **Analysis**: Click "Run Analysis" to let the AI evaluate trust boundaries and protocols.
3. **Report**: Get a list of specific threats (Spoofing, Tampering, etc.) with mitigation advice.

---

## Governance & Policy Engine

**URL:** `/policies`

### Policy Management

- **AI Auto-Draft**: Generate NIST-compliant policies using the **Policy Architect** agent.
- **Dependency Graph**: Visualize how one policy (e.g., "Access Control") impacts others (e.g., "Password Standard").
- **Kanban Board**: Track policy lifecycle from Draft -> Review -> Approved.

### Compliance Heatmap (`/governance`)

Visualize your standing against frameworks like ISO 27001 and SOC 2.

---

## Settings & AI Configuration

**URL:** `/settings` (or via Environment Variables)

The platform is powered by the **Unified Ax Engine**.

### AI Providers

The system automatically switches based on configuration:

1. **Local Mode (Ollama)**: Uses local models (e.g., Llama 3) for maximum privacy. Ideal for analyzing sensitive PII or internal docs.
2. **Cloud Mode (OpenAI)**: Uses GPT-4o for complex reasoning and creative drafting.

### Configuration

- **API Keys**: Managed server-side for security.
- **Model Selection**: Switch providers via `.env.local` flags (`NEXT_PUBLIC_USE_OLLAMA`).
