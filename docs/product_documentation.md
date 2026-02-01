# Astra CISO Platform - Product Documentation

**Version:** 1.0.0
**Status:** Alpha

## Product Overview

Astra CISO is an AI-powered security operations platform designed to act as a force multiplier for Chief Information Security Officers (CISOs) and security teams. It integrates governance, risk management, incident response, and threat modeling into a unified "Executive Noir" command center.

### Core Philosophy

- **AI-First**: Every module is enhanced by LLM capabilities (mocked or real).
- **Privacy-Centric**: "Thinking" happens server-side (BFF pattern); sensitive data is isolated.
- **Action-Oriented**: Focus on quick actions (One-click isolation, Report generation).

---

## Technical Architecture

The platform is built as a modern Single Page Application (SPA) with Server-Side Rendering (SSR) capabilities.

### Technology Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, `shadcn/ui` components, `lucide-react` icons.
- **State Management**: `zustand` (global store).
- **AI Integration**:
  - **Provider Abstraction Layer**: Interfaces for OpenAI, Anthropic, Google Gemini, and Mock providers.
  - **OpenClaw Client**: A specialized client for security-specific AI tasks (Policy drafting, Risk analysis).

### BFF Pattern (Backend-for-Frontend)

Astra uses a BFF architecture to secure AI interactions.

- **Client**: Sends inputs to Next.js API Routes.
- **Server (API Route)**: Inject context, sanitizes inputs, and holds API keys.
- **AI Provider**: Receives the request from the server, never the client.

---

## Feature Catalog

### 1. Intelligence Engine (`/api/agent`)

- **Purpose**: Power AI features across the platform.
- **Capabilities**: Policy drafting, Wargame scenario generation, Incident response guidance.
- **Integration**: Pluggable provider system allows switching between models (e.g., GPT-4, Claude 3, Gemini Pro) via the Settings page.

### 2. SecOps Dashboard

- **Components**: `PipelineCard`, `CloudProviderCard`, `FindingRow`.
- **Data Source**: Currently uses mock data generators to simulate CI/CD and Cloud environments.
- **Key Metrics**: Security Gate pass rate, Cloud Compliance %.

### 3. Wargame Simulator

- **Engine**: Turn-based logic engine (`src/lib/wargames/engine.ts`).
- **State**: Uses `useWargameStore` to track scenario state, turn history, and resources (Budget, Reputation, Stability).
- **Features**: Scenario Builder, AI Red Team (simulated adversary).

### 4. Threat Modeling Engine

- **Engine**: STRIDE analysis logic (`src/lib/threat-engine.ts`).
- **Visualization**: `mermaid.js` for dynamic architecture diagrams.
- **Flow**: Architect -> Analyze -> Identify Threats -> Mitigate.

### 5. Reporting Module

- **Engine**: `react-pdf` or HTML-to-PDF conversion logic.
- **Templates**: Pre-defined structures for various report types.
- **Storage**: Local state for report history (session-based).

---

## Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Login/Register routes 
│   ├── (dashboard)/       # Main protected application routes
│   └── api/               # Backend API routes (BFF)
├── components/            # React components
│   ├── layout/            # Shell, Sidebar, Header
│   ├── ui/                # Base UI components (Buttons, Cards)
│   └── [feature]/         # Feature-specific components (e.g., /secops)
├── lib/                   # Utilities and logic
│   ├── ai/                # AI Provider implementations
│   ├── stores/            # Zustand stores
│   └── ...
└── middleware.ts          # Auth protection and routing logic
```

## Setup & Installation

1. **Clone Repository**: `git clone <repo>`
2. **Install Dependencies**: `npm install`
3. **Environment**: Copy `.env.example` to `.env.local` and populate keys (optional for Mock mode).
4. **Run Development Server**: `npm run dev`
5. **Build for Production**: `npm run build`

## Security Considerations

- **Authentication**: Stubbed authentication via `middleware.ts`. In production replace with NextAuth.js or Clerk.
- **Input Validation**: All user inputs passed to LLMs should be sanitized.
- **Secret Management**: API keys must be stored in server-side environment variables.
