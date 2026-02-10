import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// High-fidelity Mock Data (Mimics real Trivy JSON output)
const MOCK_TRIVY_OUTPUT = {
    "SchemaVersion": 2,
    "Results": [
        {
            "Target": "Gemfile.lock",
            "Class": "lang-pkgs",
            "Type": "bundler",
            "Vulnerabilities": [
                {
                    "VulnerabilityID": "CVE-2023-28120",
                    "PkgName": "rails-html-sanitizer",
                    "InstalledVersion": "1.4.4",
                    "FixedVersion": "1.4.4.1",
                    "Severity": "CRITICAL",
                    "Title": "XSS in rails-html-sanitizer",
                    "Description": "Cross-site scripting (XSS) vulnerability in rails-html-sanitizer allows attacker to inject malicious scripts.",
                    "PrimaryURL": "https://avd.aquasec.com/nvd/cve-2023-28120"
                }
            ]
        },
        {
            "Target": "package-lock.json",
            "Class": "lang-pkgs",
            "Type": "node-pkg",
            "Vulnerabilities": [
                {
                    "VulnerabilityID": "CVE-2024-21538",
                    "PkgName": "micromatch",
                    "InstalledVersion": "4.0.5",
                    "FixedVersion": "4.0.8",
                    "Severity": "HIGH",
                    "Title": "Regular Expression Denial of Service (ReDoS)",
                    "Description": "The micromatch package is vulnerable to ReDoS via specific patterns.",
                    "PrimaryURL": "https://avd.aquasec.com/nvd/cve-2024-21538"
                },
                {
                    "VulnerabilityID": "CVE-2024-4067",
                    "PkgName": "crypto-js",
                    "InstalledVersion": "4.1.1",
                    "FixedVersion": "4.2.0",
                    "Severity": "MEDIUM",
                    "Title": "Weak Hashing Algorithm",
                    "Description": "Usage of weak hashing algorithms in crypto-js context.",
                    "PrimaryURL": "https://avd.aquasec.com/nvd/cve-2024-4067"
                }
            ]
        }
    ]
};

export async function GET() {
    try {
        // 1. Check if Trivy is available and run it
        // We limit to Critical/High to keep it fast and relevant for executive brief
        // --security-checks vuln means we skips config checks for speed
        const { stdout } = await execAsync('trivy file . --format json --severity CRITICAL,HIGH --security-checks vuln --timeout 5m');

        console.log("Trivy Scan: Success (Real Data)");
        return NextResponse.json(JSON.parse(stdout));

    } catch (error: any) {
        // 2. Fallback to Simulation if CLI is missing or fails
        console.warn("Trivy Scan: CLI not found or failed. Using Simulation Mode.", error.message);

        // Add a metadata field to indicate this is a simulation
        return NextResponse.json({
            ...MOCK_TRIVY_OUTPUT,
            Metadata: {
                Simulated: true,
                Message: "Trivy CLI not detected. Showing sample vulnerability data."
            }
        });
    }
}
