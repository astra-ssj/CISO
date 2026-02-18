/**
 * FAIR (Factor Analysis of Information Risk) Engine
 * 
 * Provides quantitative risk analysis based on the FAIR model ontology.
 * Calculates Annualized Loss Expectancy (ALE) and normalized Risk Scores.
 */

export interface RiskScenario {
    id: string;
    assetName: string;
    threatActor: 'NATION_STATE' | 'CYBER_CRIMINAL' | 'INSIDER' | 'HACKTIVIST' | 'SCRIPT_KIDDIE';

    // Loss Event Frequency (LEF) Factors
    threatEventFrequency: number; // Times per year (min: 0.1, max: 1000)
    vulnerability: number; // Probability of successful exploit (0.0 - 1.0)

    // Loss Magnitude (LM) Factors
    primaryLoss: number; // Direct financial loss ($)
    secondaryLoss: number; // Reputation, fines, legal ($)

    // Control Effectiveness (for simplified scoring)
    controlsEffective: number; // 0.0 - 1.0 (1.0 = perfect defense)
}

export interface RiskAnalysisResult {
    scenarioId: string;
    lossEventFrequency: number;
    probableLossMagnitude: number;
    annualizedLossExpectancy: number; // ALE = LEF * LM
    riskScore: number; // 0-100 Normalized Score
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * Calculates the quantitative risk metrics for a given scenario.
 */
export function calculateRisk(scenario: RiskScenario): RiskAnalysisResult {
    // 1. Calculate Loss Event Frequency (LEF)
    // LEF = TEF * Vuln
    // Standard FAIR uses Monte Carlo, we use a deterministic simplified model for the UI
    const lef = scenario.threatEventFrequency * scenario.vulnerability;

    // 2. Calculate Loss Magnitude (LM)
    const lm = scenario.primaryLoss + scenario.secondaryLoss;

    // 3. Calculate Annualized Loss Expectancy (ALE)
    // ALE represents the expected financial loss per year
    const ale = lef * lm;

    // 4. Calculate Normalized Risk Score (0-100)
    // We use a logarithmic scale because ALE can range from $100 to $100B
    // Base 10 log. $1M ALE might be a score of 50. $1B ALE might be 90.
    // Score = (log10(ALE) / log10(Max_Reference_ALE)) * 100
    // Let's assume Max Reference ALE is $100M for this organization size context
    const MAX_REF_ALE = 100_000_000;

    let rawScore = 0;
    if (ale > 0) {
        // Shift log to handle small values better? 
        // Simple linear mapping for now:
        // 0 - $10k -> 0-20
        // $10k - $100k -> 20-40
        // $100k - $1M -> 40-60
        // $1M - $10M -> 60-80
        // $10M+ -> 80-100+

        if (ale < 10000) rawScore = (ale / 10000) * 20;
        else if (ale < 100000) rawScore = 20 + ((ale - 10000) / 90000) * 20;
        else if (ale < 1000000) rawScore = 40 + ((ale - 100000) / 900000) * 20;
        else if (ale < 10000000) rawScore = 60 + ((ale - 1000000) / 9000000) * 20;
        else rawScore = 80 + Math.min(20, (Math.log10(ale) - 7) * 10);
    }

    // Adjust score based on Controls (if they mitigate impact or frequency outside of the basic params)
    // In strict FAIR, controls affect Vuln or LM. Here we treat 'controlsEffective' as a final damper if needed,
    // but usually it should have already reduced Vuln. 
    // Let's assume the parameters passed IN already reflect controls, so we don't double count.

    const riskScore = Math.min(100, Math.max(0, Math.round(rawScore)));

    // Determine Level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (riskScore >= 80) riskLevel = 'CRITICAL';
    else if (riskScore >= 60) riskLevel = 'HIGH';
    else if (riskScore >= 40) riskLevel = 'MEDIUM';

    return {
        scenarioId: scenario.id,
        lossEventFrequency: lef,
        probableLossMagnitude: lm,
        annualizedLossExpectancy: ale,
        riskScore,
        riskLevel
    };
}

/**
 * Google-style Risk Scoring (simplified heuristic)
 * Based on: Criticality * Threat * (1 - Controls)
 */
export function calculateGoogleRiskScore(
    assetCriticality: number, // 1-10
    threatCapability: number, // 1-10
    controlEffectiveness: number // 0.0 - 1.0 (1.0 is perfect)
): number {
    // Max raw score = 10 * 10 = 100
    const rawRisk = assetCriticality * threatCapability;

    // Apply controls
    const residualRisk = rawRisk * (1 - controlEffectiveness);

    return Math.round(residualRisk);
}
