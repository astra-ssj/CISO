import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: [path.resolve(__dirname, '../setup.ts')],
        include: ['tests/smoke/**/*.test.ts', 'tests/smoke/**/*.test.tsx'],
        exclude: [],
    },
    resolve: {
        alias: { '@': path.resolve(__dirname, '../../src') },
    },
});
