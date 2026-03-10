import { AppSecFinding, Severity, FindingType } from './types';

// ============================================================================
// Shared Utilities
// ============================================================================

function generateId(prefix: string, ...parts: string[]): string {
  return `${prefix}-${Buffer.from(parts.join('-')).toString('base64').substring(0, 16)}`;
}

// ============================================================================
// Semgrep Parser (SAST)
// ============================================================================
/* Expected Semgrep JSON format (simplified):
{
  "results": [
    {
      "check_id": "rules.python.security...",
      "path": "src/app.py",
      "start": { "line": 42 },
      "extra": {
        "message": "Use of hardcoded password",
        "severity": "ERROR" // WARNING, INFO
      }
    }
  ]
}
*/
export function parseSemgrep(jsonStr: string): AppSecFinding[] {
  try {
    const data = JSON.parse(jsonStr);
    if (!data || !Array.isArray(data.results)) return [];

    return data.results.map((res: any) => {
      let severity: Severity = 'LOW';
      if (res.extra?.severity === 'ERROR') severity = 'CRITICAL';
      if (res.extra?.severity === 'WARNING') severity = 'MEDIUM';
      if (res.extra?.severity === 'INFO') severity = 'INFO';

      return {
        id: generateId('semgrep', res.path || '', String(res.start?.line || ''), res.check_id || ''),
        type: 'SAST' as const,
        severity,
        title: res.check_id ? res.check_id.split('.').pop() || res.check_id : 'Static Analysis Finding',
        description: res.extra?.message || 'No description provided.',
        file: res.path,
        line: res.start?.line,
        tool: 'Semgrep',
        detectedAt: new Date().toISOString(),
        match: res.extra?.lines?.trim()
      };
    });
  } catch (e) {
    console.error("Failed to parse Semgrep JSON", e);
    return [];
  }
}

// ============================================================================
// Trivy Parser (Container/Dependencies)
// ============================================================================
/* Expected Trivy JSON format (simplified):
{
  "Results": [
    {
      "Target": "alpine:3.15",
      "Vulnerabilities": [
        {
          "VulnerabilityID": "CVE-2022-XXXX",
          "PkgName": "openssl",
          "Severity": "CRITICAL", // HIGH, MEDIUM, LOW, UNKNOWN
          "Title": "buffer overflow...",
          "Description": "..."
        }
      ]
    }
  ]
}
*/
export function parseTrivy(jsonStr: string): AppSecFinding[] {
  try {
    const data = JSON.parse(jsonStr);
    if (!data || !Array.isArray(data.Results)) return [];

    const findings: AppSecFinding[] = [];

    for (const result of data.Results) {
      if (!Array.isArray(result.Vulnerabilities)) continue;

      for (const vuln of result.Vulnerabilities) {
        let severity: Severity = 'INFO';
        if (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(vuln.Severity)) {
          severity = vuln.Severity as Severity;
        }

        findings.push({
          id: generateId('trivy', result.Target || '', vuln.VulnerabilityID || ''),
          type: 'CONTAINER' as const,
          severity,
          title: `${vuln.VulnerabilityID} in ${vuln.PkgName}`,
          description: vuln.Title || vuln.Description || 'No description provided.',
          file: result.Target,
          tool: 'Trivy',
          cwe: vuln.CweIDs?.[0],
          detectedAt: new Date().toISOString(),
        });
      }
    }
    return findings;
  } catch (e) {
    console.error("Failed to parse Trivy JSON", e);
    return [];
  }
}

// ============================================================================
// Gitleaks Parser (Secrets)
// ============================================================================
/* Expected Gitleaks JSON format (simplified):
[
  {
    "Description": "Generic API Key",
    "Match": "api_key = \"AKIAIOSFODNN7EXAMPLE\"",
    "Secret": "AKIAIOSFODNN7EXAMPLE",
    "File": "config.yaml",
    "StartLine": 12 
  }
]
*/
export function parseGitleaks(jsonStr: string): AppSecFinding[] {
  try {
    const data = JSON.parse(jsonStr);
    if (!Array.isArray(data)) return [];

    return data.map((leak: any) => ({
      id: generateId('gitleaks', leak.File || '', String(leak.StartLine || ''), leak.Secret || ''),
      type: 'SECRET' as const,
      severity: 'CRITICAL', // Hardcoded critical for exposed secrets
      title: leak.Description || 'Exposed Secret',
      description: `A secret of type "${leak.Description}" was found in ${leak.File}.`,
      file: leak.File,
      line: leak.StartLine,
      tool: 'Gitleaks',
      match: leak.Match,
      detectedAt: new Date().toISOString(),
    }));
  } catch (e) {
    console.error("Failed to parse Gitleaks JSON", e);
    return [];
  }
}

// ============================================================================
// Local Package.json Parser (SCA Simulation)
// ============================================================================
/* Expected package.json format (simplified):
{
  "dependencies": {
    "lodash": "4.17.19"
  }
}
*/
export function parsePackageJson(jsonStr: string): AppSecFinding[] {
  try {
    const data = JSON.parse(jsonStr);
    const findings: AppSecFinding[] = [];

    const allDeps = {
      ...(data.dependencies || {}),
      ...(data.devDependencies || {})
    };

    // Hardcode a few common vulnerable version signatures for simulation purposes
    const VULN_DB: Record<string, { versionMatch: string, sev: Severity, cve: string, desc: string, rem: string }> = {
      'lodash': { versionMatch: '4.17.19', sev: 'HIGH', cve: 'CVE-2020-28500', desc: 'Lodash before 4.17.21 is vulnerable to Regular Expression Denial of Service (ReDoS) via the toNumber, trim and trimEnd functions.', rem: 'Upgrade lodash to 4.17.21 or later.' },
      'react-scripts': { versionMatch: '4.0.3', sev: 'MEDIUM', cve: 'CVE-2021-33502', desc: 'nth-check <2.0.1 is vulnerable to ReDoS. react-scripts 4.0.3 depends on a vulnerable version of svgo.', rem: 'Upgrade react-scripts to 5.0.0 or later.' },
      'axios': { versionMatch: '0.19.0', sev: 'CRITICAL', cve: 'CVE-2020-28168', desc: 'SSRF vulnerability in axios before 0.21.1.', rem: 'Upgrade axios to 0.21.1 or later.' }
    };

    for (const [pkg, version] of Object.entries(allDeps)) {
      const cleanVersion = (version as string).replace(/[\^~]/g, '');
      if (VULN_DB[pkg] && VULN_DB[pkg].versionMatch === cleanVersion) {
        const vuln = VULN_DB[pkg];
        findings.push({
          id: generateId('local-sca', pkg, cleanVersion),
          type: 'SCA' as const,
          severity: vuln.sev,
          title: `Vulnerable Dependency: ${pkg}`,
          description: vuln.desc,
          file: 'package.json',
          tool: 'Local SCA Scanner',
          cwe: vuln.cve,
          match: `"${pkg}": "${version}"`,
          remediation: vuln.rem,
          detectedAt: new Date().toISOString()
        });
      }
    }

    return findings;
  } catch (e) {
    console.error("Failed to parse package.json", e);
    return [];
  }
}
