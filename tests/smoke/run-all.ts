/**
 * Runner for all smoke tests
 * Usage: npx tsx tests/smoke/run-all.ts
 */

import { execSync } from 'child_process';

console.log('💨 Running all smoke tests...\n');

try {
    execSync('npx vitest run --config tests/smoke/vitest.smoke.config.ts --reporter=verbose', {
        stdio: 'inherit',
        cwd: process.cwd(),
    });
    console.log('\n✅ All smoke tests passed');
} catch {
    console.error('\n❌ Some smoke tests failed');
    process.exit(1);
}
