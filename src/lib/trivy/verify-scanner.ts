
import { scanProject } from './scanner';

async function main() {
    console.log("Running Trivy Scan...");
    try {
        const report = await scanProject('.');
        console.log("Scan Complete.");
        console.log("Artifact Name:", report.ArtifactName);
        console.log("Result Count:", report.Results?.length || 0);
        if (report.Results?.length > 0) {
            console.log("First Result Target:", report.Results[0].Target);
            console.log("Vulnerabilities Found:", report.Results[0].Vulnerabilities?.length || 0);
        }
    } catch (e) {
        console.error("Scan Failed:", e);
    }
}

main();
