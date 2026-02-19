# Reverse Engineered Project Prompts

Based on the forensic analysis of the `Astra-CISO` codebase, `SOUL.MD`, and architectural documentation, here is the reconstruction of the original prompts used to build this project, broken down by development phase.

## Phase 0: System Identity & Core Persona

**Context:** The project starts with a strong definition of its identity and role.

> "You are **S.R.I.S.T.I.** (Smart Rapid Intelligent Systems & Tooling Interface). Your role is the **Senior Director of Technical Security Governance**.
>
> Your goal is to build a "CISO Operating System" — a high-fidelity, futuristic dashboard that bridges the gap between high-level governance (ISO 27001, SOC 2) and technical reality.
>
> **Core Directives:**
>
> 1. **The Prime Directive:** Architect resilient infrastructures. Validate every byte against security standards.
> 2. **Aesthetics:** High-end "Cyberpunk Corporate" or "Glassmorphism". Dark mode by default. Think "Minority Report" meets "Enterprise SaaS".
> 3. **Tech Stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Shadcn/UI, Lucide Icons.
> 4. **Constraint:** The application must work **offline-first** with zero external database dependencies initially. Use **Zustand** for complex global state management and persistence."

---

## Phase 1: Foundation & "Offline-First" Logic

**Context:** Before building the UI, the detailed business logic and data structures were established.

> "Create the core logic engines for the CISO platform. Since we are offline-first, these should be TypeScript libraries (`src/lib`) that handle complex calculations without a backend.
>
> 1. **Compliance Engine:** Define rigid TypeScript interfaces for compliance frameworks (GDPR, NIST CSF 2.0, ISO 27001, EU AI Act). Create a static 'Golden Library' of controls with risk levels and evidence requirements.
> 2. **Risk Engine:** Implement a quantitative risk analysis engine based on the **FAIR Model** (Factor Analysis of Information Risk). It should calculate Annualized Loss Expectancy (ALE) based on Threat Event Frequency and Loss Magnitude.
> 3. **State Management:** Set up a global `Zustand` store (`astra-store`) with persistence. It should handle the 'Decision Queue', 'Active Threats', and 'System Status'."

---

## Phase 2: The Command Center (UI/UX)

**Context:** Building the visual layer to visualize the data from Phase 1.

> "Build the main Dashboard Shell and 'Command Center' page.
>
> **Design Requirements:**
>
> - **Sidebar:** Collapsible, with distinct sections for Strategy, Intelligence, Operations, and Governance.
> - **Executive Brief:** A 'Bento Grid' layout showing the most critical metrics: Investment Heatmap, Top Risks, and Compliance Velocity.
> - **Defense Matrix:** A high-density data grid (like a spreadsheet but beautiful) to track thousands of compliance controls. Use 'pills' for status (Audited, Failed, Pending).
> - **Visuals:** Use `Recharts` for data visualization. Create a 'Nexus Graph' topology view for network assets.
>
> **User Stories:**
>
> - As a CISO, I want to see my 'Real-time Vulnerability Remediation' velocity.
> - I want to toggle between 'Strategic View' (Board) and 'Tactical View' (Ops)."

---

## Phase 3: Intelligence & "AI Agents"

**Context:** Adding the "Smart" features using AI and simulation engines.

> "Integrate Generative AI and simulation capabilities.
>
> 1. **The AI Engine:** Create an abstraction layer (`src/lib/ai/engine.ts`) that supports Google Gemini, Anthropic Claude, and a local 'Mock' mode. It should be able to 'Draft Policies' and 'Analyze Threats'.
> 2. **War Games:** Build a simulation module (`/wargames`) that runs tabletop exercises (e.g., 'Ransomware Attack', 'Insider Threat'). Use the AI engine to generate dynamic injects and scenario evolution based on user choices.
> 3. **OpenClaw:** Implement an 'OSINT' (Open Source Intelligence) scanner that simulates finding exposed credentials or assets."

---

## Phase 4: Integration & Hardening

**Context:** Connecting to external tools and preparing for "Enterprise Readiness".

> "Connect the platform to the real world and harden it for release.
>
> 1. **Integrations:**
>     - **Jira:** Connect to Jira Cloud API to create tickets from vulnerability findings.
>     - **Trivy:** Integrate with Trivy generic JSON output to visualize container scan results.
> 2. **Security:** Implement a 'Data Airlock' pattern. Ensure no sensitive data leaves the browser unless explicitly authorized. Add Role-Based Access Control (RBAC) middleware.
> 3. **Reporting:** Create a 'Board Deck Generator' that scrapes the current dashboard state and exports a PDF/PPTX summary for executive meetings."
