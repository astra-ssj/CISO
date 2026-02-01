# Astra CISO Platform - System Architecture

> [!IMPORTANT]
> This document details the technical architecture of the Astra CISO platform, covering both high-level system design and low-level component implementation.

## 1. High-Level Architecture (HLA)

The Astra CISO platform follows a modern **Backend-for-Frontend (BFF)** architecture, designed to balance rich client-side interactivity with server-side security and secret isolation.

```mermaid
graph TD
    subgraph Client ["Client Layer (Browser)"]
        UI[React UI (Next.js)]
        Store[Zustand State Store]
        LocalEng[Local Engines (Wargame)]
    end

    subgraph Edge ["Edge Layer"]
        MW[Middleware (Auth Guard)]
    end

    subgraph Server ["Server Layer (Node.js/Edge)"]
        BFF[BFF API Routes]
        Intel[Intelligence Engine]
        Threat[Threat Engine Core]
    end

    subgraph External ["External Services"]
        LLM[AI Providers (OpenAI/Anthropic)]
        DB[(Policy Database - Mock)]
    end

    User((CISO User)) -->|Interacts| UI
    UI -->|State Updates| Store
    UI <-->|Nav Requests| MW
    UI -->|Secure API Ops| BFF
    BFF -->|Context Injection| Intel
    Intel -->|Inference| LLM
    BFF -->|Analysis| Threat
```

### 1.1 Core Layers

1. **Presentation Layer (Client)**
    * **Framework**: Next.js 14 (App Router).
    * **UI Library**: Tailwind CSS + Shadcn/UI.
    * **Responsibility**: Rendering views, managing local user interactions, and visualising data (Charts, Diagrams).
    * **Isolation**: No API keys or sensitive backend logic exist here.

2. **State Management Layer**
    * **Library**: `Zustand`.
    * **Persistence**: `localStorage` for session continuity (Risk Scores, Theme, Auth Token).
    * **Stores**:
        * `useAstraStore`: Global system status, User session, Notifications.
        * `useWargameStore`: Simulation state, Turn history.

3. **BFF / API Layer (Server)**
    * **Technology**: Next.js API Routes.
    * **Responsibility**:
        * Authentication verification (Cookies).
        * Input validation & Sanitization.
        * Orchestrating calls to AI providers.
        * Secret Management (Holding `OPENAI_API_KEY`, etc.).

4. **Logic Core**
    * **Intelligence Engine**: Context-aware LLM interaction (Prompt Engineering, RAG).
    * **Threat Engine**: Algorithmic rules engine for STRIDE analysis.
    * **Wargame Engine**: Turn-based state machine for simulations.

---

## 2. Low-Level Architecture (LLA)

### 2.1 Directory Structure & Modules

The codebase is organized by feature and function to ensure maintainability.

| Directory | Purpose | Key Components |
|-----------|---------|----------------|
| `src/app` | Routes & Pages | `(dashboard)`, `api/agent` |
| `src/components` | UI & Features | `layout/Shell.tsx`, `ui/*` |
| `src/lib` | Business Logic | `store.ts`, `threat-engine.ts`, `openai-provider.ts` |
| `src/hooks` | React Hooks | `use-toast.ts`, custom utilities |

### 2.2 Key Engines & Algorithms

#### A. Wargame Simulator (`src/lib/wargames/engine.ts`)

* **Pattern**: Finite State Machine (FSM).
* **States**: `IDLE` -> `SCENARIO_LOAD` -> `TURN_ACTIVE` -> `RESOLUTION` -> `REPORT`.
* **Logic**:
  * Calculates `Probability of Success` based on Budget & Reputation.
  * Applies RNG (Random Number Generation) for event outcomes.
  * Updates global metrics (Stability, Public Trust) post-turn.

#### B. Threat Modeling Engine (`src/lib/threat-engine.ts`)

* **Input**: JSON Architecture (`Components[]`, `Flows[]`).
* **Logic**: Rules-based Analysis (STRIDE).
  * *Example Rule*: If `Component.type == DATABASE` AND `Flow.protocol == HTTP`, Then trigger `Information Disclosure` threat.
* **Output**: Mermaid Graph Definition (`string`) + Threat List (`Threat[]`).

#### C. Intelligence Engine (`src/lib/ai/*`)

* **Pattern**: Provider Strategy Pattern.
* **Interface**: `AIProvider` (generate, stream, analyze).
* **Implementations**:
  * `MockProvider`: Returns deterministic responses for testing.
  * `OpenAIProvider`: Connects to GPT-4.
  * `AnthropicProvider`: Connects to Claude 3.
* **Flow**: Client -> BFF -> ProviderFactory -> SelectedProvider -> External API.

### 2.3 Data Models

#### Global Store (`AstraState`)

```typescript
interface AstraState {
    systemStatus: 'NOMINAL' | 'DEGRADED' | 'UNDER_ATTACK';
    complianceScore: number;
    decisionQueue: DecisionRequest[]; // Pending approvals
    currentUser: User | null;         // Session info
    isAuthenticated: boolean;
}
```

#### Decision Request

```typescript
interface DecisionRequest {
    id: string;
    riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    status: 'PENDING' | 'APPROVED' | 'DENIED';
    analysis: {
        riskScore: number;
        complianceGaps: string[];
    };
}
```

## 3. Security Architecture

### 3.1 Authentication

* **Mechanism**: Cookie-based Sessions (`astra-auth`).
* **Middleware**: `src/middleware.ts` runs on Edge to intercept requests.
  * **Protected**: `/dashboard/*`, `/api/agent/*`.
  * **Public**: `/login`, `_next/static`.

### 3.2 Secret Isolation

* **Problem**: Client-side apps cannot safely store secrets.
* **Solution**: All external API calls (to OpenAI, OpenClaw) originate from **Server-Side** API routes.
* **Env Vars**: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` are loaded only in the Node.js runtime.

### 3.3 Input Validation

* **client**: Zod schemas for form validation.
* **Server**: Request body sanitization before passing to LLMs to prevent Prompt Injection.

## 4. Scalability & Performance

* **Server-Side Rendering (SSR)**: Critical dashboards (`/secops`) use SSR for initial load speed.
* **Code Splitting**: Next.js automatically chunks JS bundles per route.
* **Static Assets**: Images and fonts served via CDN optimization.
