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
8. [CAIQ Vendor Assessment](#caiq-vendor-assessment)
9. [Settings & AI Configuration](#settings--ai-configuration)

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

## CAIQ Vendor Assessment

**URL:** `/vendors`

The CAIQ (Consensus Assessments Initiative Questionnaire) module automates CSA CAIQ v4 questionnaire responses for vendor risk assessments. You can upload a questionnaire, configure your organization context, run an assessment, review and approve answers, and export results.

### How to upload a CAIQ v4 questionnaire

1. Go to **Vendors** in the sidebar.
2. Use **Upload CAIQ** (or equivalent) to select an Excel file in CSA CAIQ v4 format.
3. The parser detects sheets and columns by header keywords (e.g. "Control ID", "Question", "Answer", "Evidence"). Supported layouts include separate question/answer columns or combined response columns.
4. After upload, you see the list of parsed questions and any pre-filled answers. Unanswered questions are highlighted for assessment.

### How to configure organization context

Organization context drives more accurate, org-specific answers:

- **Environment variables** (optional): Set `ASTRA_ORG_NAME`, `ASTRA_INDUSTRY`, `ASTRA_CLOUD_MODEL` (IaaS/PaaS/SaaS/Hybrid), `ASTRA_ORG_SIZE` (Startup/SMB/Enterprise), `ASTRA_JURISDICTION` (comma-separated).
- **Evidence store**: Upload evidence items and map them to frameworks and control IDs. The CAIQ engine links evidence to questions via the knowledge base’s framework mappings.
- **Policy store**: Approved/active policies with framework mappings are used as relevant controls.
- **Answer overrides**: Persisted manual overrides (e.g. in localStorage under `aegis-caiq-answer-overrides`) are applied before returning an answer.

The engine uses this context for AI prompts and for evidence references on answers.

### How to run an assessment

1. After uploading a questionnaire and (optionally) configuring context, start the assessment from the Vendors/CAIQ UI.
2. The **4-tier pipeline** runs for each question:
   - **Tier 1 — Exact match**: If the question ID matches a knowledge-base entry, that entry’s answer (with org overrides and evidence) is used; confidence ~0.97.
   - **Tier 2 — Semantic match**: A local TF-IDF/cosine matcher finds similar KB questions; the best match above the threshold is adapted; confidence 0.80–0.95.
   - **Tier 3 — AI-generated**: If no KB match is sufficient, the configured AI provider generates an answer (with circuit breaker and optional fallback); confidence ~0.60–0.80.
   - **Tier 4 — Flagged**: If AI is unavailable or fails, the question is flagged for human review with confidence 0.
3. Progress can be streamed (e.g. via an optional progress callback). Each answer is logged to the audit trail.

### How to review and approve answers

- Answers with **confidence below the auto-approve threshold** (default 0.9) are marked **needs review**.
- The validator runs alignment, cross-consistency, evidence completeness, framework mapping, and (for AI-generated answers) an optional AI self-check. Failed checks lower **validated confidence** and can force **needs review**.
- In the Vendors/CAIQ UI, filter or sort by **needs review** or confidence tier. Edit any answer, attach evidence, and approve. Approved/reviewed state and reviewer can be stored and included in exports.

### How to export results

- **Excel (CAIQ v4 format)**: Export a full assessment with a main sheet (Control ID, Question, Answer, Answer Details, Evidence, Framework Mappings), a Metadata sheet (date, org, assessor, stats, AI provider), and an Audit Trail sheet (tier, generated by, confidence, reviewer, timestamps). Rows are color-coded by confidence (green ≥0.95, yellow 0.60–0.95, red &lt;0.60).
- **PDF audit report**: Export a PDF with cover, executive summary, per-domain answer sections, and appendices for audit trail and methodology.

Use the export actions in the CAIQ/Vendors flow and optionally provide a question-text map, assessor name, and AI provider label.

### Confidence tiers and autonomy levels

| Tier            | Source           | Typical confidence | Autonomy / use |
|-----------------|------------------|--------------------|----------------|
| **EXACT_MATCH** | KB by question ID | 0.95–0.99          | High; auto-approved when above threshold. |
| **SEMANTIC_MATCH** | KB by similarity | 0.80–0.95       | High; review optional for strong matches. |
| **AI_GENERATED** | Primary or fallback AI | 0.60–0.80   | Medium; validator and optional AI self-check; often needs review. |
| **FLAGGED**     | No KB or AI       | 0.0                | None; human must answer and attach evidence. |

The **auto-approve threshold** (default 0.9) and **flag threshold** (default 0.6) control which answers are marked for review. The circuit breaker opens after AI failures and can trigger fallback to a secondary provider or Tier 4.

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
