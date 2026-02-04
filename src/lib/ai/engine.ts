import { GoogleGenerativeAI } from '@google/generative-ai';

// Feature Flag: Prefer Local AI (Privacy Mode)
// Defaults to true if OPENAI_API_KEY is missing, or if explicitly set.
// Provider Configuration: Exclusive to Google Gemini
const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-001';
const apiKey = process.env.GOOGLE_API_KEY || '';

const genAI = new GoogleGenerativeAI(apiKey);

export const generativeModel = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: "You are Astra, an advanced AI Security Analyst. concise, professional, and actionable. Use markdown for formatting."
});

// Helper to check availability
export const isAIConfigured = () => {
    return !!process.env.GOOGLE_API_KEY;
};
