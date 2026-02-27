/**
 * Runner for all integration tests
 * Usage: npx tsx tests/integration/run-all.ts
 */

import { execSync } from 'child_process';

console.log('🔬 Running all integration tests...\n');

try {
    execSync('npx vitest run --config tests/integration/vitest.integration.config.ts --reporter=verbose', {
        stdio: 'inherit',
        cwd: process.cwd(),
    });
    console.log('\n✅ All integration tests passed');
} catch {
    console.error('\n❌ Some integration tests failed');
    process.exit(1);
}
