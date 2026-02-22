import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface TrivyVulnerability {
    VulnerabilityID: string;
    PkgName: string;
    InstalledVersion: string;
    FixedVersion: string;
    Severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    Title: string;
    Description: string;
    PrimaryURL: string;
}

export interface TrivyResult {
    Target: string;
    Class: string;
    Type: string;
    Vulnerabilities?: TrivyVulnerability[];
}

export interface TrivyReport {
    SchemaVersion: number;
    ArtifactName: string;
    ArtifactType: string;
    Results: TrivyResult[];
}

export async function scanProject(path: string = '.'): Promise<TrivyReport> {
    try {
        // Run Trivy in filesystem mode, outputting JSON
        // standard command: trivy fs <path> --format json
        const { stdout } = await execAsync(`trivy fs ${path} --format json`);

        if (!stdout) {
            throw new Error("No output from Trivy scan");
        }

        return JSON.parse(stdout) as TrivyReport;
    } catch (error: unknown) {
        console.error("Trivy scan failed:", error);
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Trivy scan failed: ${message}`);
    }
}
