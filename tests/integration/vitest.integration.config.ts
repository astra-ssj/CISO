import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        setupFiles: [path.resolve(__dirname, '../setup.ts')],
        include: ['tests/integration/**/*.test.ts', 'tests/integration/**/*.test.tsx'],
        exclude: [],
    },
    resolve: {
        alias: { '@': path.resolve(__dirname, '../../src') },
    },
});
