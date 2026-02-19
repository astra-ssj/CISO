# Astra CISO Platform - Frequently Asked Questions (FAQ)

## 1. What is the Astra CISO Platform?

Astra is an AI-powered "Security Operating System" for CISOs. It consolidates governance, risk, and compliance (GRC) into a single command center, bridging the gap between high-level policy (ISO 27001) and technical reality. It features an "Offline-First" architecture for resilience during crises.

## 2. How do I run the application locally?

You need Node.js installed. In your terminal, run:

```bash
npm install
npm run dev
```

The application will launch at `http://localhost:3000`.

## 3. What are the default login credentials?

For the local demo environment, use:

- **Username**: `admin`
- **Password**: `changeme`
*(In a production environment, these would be managed via secure environment variables).*

## 4. Does Astra connect to a real database?

**No, by default Astra is "Offline-First".**
It uses **Zustand** stores persisted to your browser's LocalStorage. This ensures immediate responsiveness and zero external dependencies for demos or air-gapped simulations. For enterprise deployment, it can be configured to sync with a PostgreSQL database via Prisma.

## 5. Which AI models does it support?

Astra uses a generic AI abstraction layer that supports three providers:

1. **Google Gemini**: For fast, multimodal analysis.
2. **Anthropic Claude**: For complex policy drafting.
3. **Ollama**: For running local models (like Llama 3) in air-gapped environments.

## 6. Is my data secure and private?

Yes. Astra employs a **"Data Airlock"** architecture. Core GRC data (Risk Registers, Compliance Status) remains in your browser or local storage. When using Cloud AI (Gemini/Claude), only the specific prompt context is sent—never your full database. If you use **Ollama**, no data leaves your machine.

## 7. How does the "Risk Engine" calculate scores?

Astra uses the **FAIR Model** (Factor Analysis of Information Risk). It calculates **Annualized Loss Expectancy (ALE)** based on:

- **Threat Event Frequency**: Probable attacks per year.
- **Loss Magnitude**: Financial impact ($) of a breach.
- **Vulnerability**: The probability of an attack succeeding.

## 8. What is "Demon Mode"?

"Demon Mode" is a high-contrast, distraction-free interface designed for Incident Response (War Room) scenarios. It strips away non-essential UI elements to focus the CISO on critical alerts and containment actions. Toggle it via the eye icon in the sidebar.

## 9. Can I customize the Compliance Frameworks?

Yes. The platform includes a "Golden Library" of controls for GDPR, NIST CSF 2.0, ISO 27001, and the EU AI Act. You can modify `src/lib/compliance-frameworks.ts` to add your organization's specific internal controls or map existing controls to new frameworks.

## 10. Troubleshooting: The AI features aren't working?

If the AI features (Chat, Policy Draft) are failing:

1. Verify you have a valid API key in your `.env.local` file (`GOOGLE_API_KEY` or `ANTHROPIC_API_KEY`).
2. Ensure `AI_PROVIDER` is set correctly.
3. If using **Ollama**, confirm the service is running locally on port `11434`.
