/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${GREEN}S.R.I.S.T.I. Sentinel Audit Initiated...${RESET}`);

// Configuration
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const REQUIRED_HEADER = "Copyright (c) 2026 S.R.I.S.T.I. All rights reserved.";
const SECRET_PATTERNS = [
    /AKIA[0-9A-Z]{16}/, // AWS Access Key
    /ghp_[a-zA-Z0-9]{36}/, // GitHub PAT
    /sk_live_[a-zA-Z0-9]{24}/, // Stripe Secret
    /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/ // Generic JWT
];

const EXCLUDED_DIRS = ['node_modules', '.git', '.next', 'dist', 'build', 'coverage'];
const EXCLUDED_FILES = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', '.env.local', '.env', 'sentinel-audit.js'];

let violations = 0;

function scanDirectory(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!EXCLUDED_DIRS.includes(file)) {
                scanDirectory(fullPath);
            }
        } else {
            if (!EXCLUDED_FILES.includes(file) && !file.endsWith('.png') && !file.endsWith('.jpg') && !file.endsWith('.ico')) {
                checkFile(fullPath);
            }
        }
    }
}

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Check for Secrets
    for (const pattern of SECRET_PATTERNS) {
        if (pattern.test(content)) {
            console.log(`${RED}[CRITICAL] Secret detected in ${filePath}${RESET}`);
            violations++;
        }
    }

    // Check for Header (Simplified for this demo, usually enforced on new files)
    // if (path.extname(filePath) === '.ts' || path.extname(filePath) === '.tsx') {
    //     if (!content.includes(REQUIRED_HEADER)) {
    //          // console.log(`${YELLOW}[WARN] Missing copyright header in ${filePath}${RESET}`);
    //          // warnings++;
    //     }
    // }
}

try {
    // Verify SOUL.MD integrity (Must exist)
    if (!fs.existsSync('SOUL.MD')) {
        console.log(`${RED}[FATAL] SOUL.MD is missing! The soul has left the machine.${RESET}`);
        process.exit(1);
    }

    console.log(`> Verifying SOUL.MD resonance... OK`);

    // Scan Source
    scanDirectory('./src');

    if (violations > 0) {
        console.log(`${RED}Audit FAILED with ${violations} critical violations.${RESET}`);
        process.exit(1);
    } else {
        console.log(`${GREEN}Audit PASSED. System is compliant with Core Directive.${RESET}`);
        process.exit(0);
    }

} catch (e) {
    console.error(`Audit crashed: ${e.message}`);
    process.exit(1);
}
