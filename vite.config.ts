import { fmt, lint } from '@noeldemartin/vite-plus-config';
import { defineConfig } from 'vite-plus';

export default defineConfig({
    test: {
        projects: ['packages/*', 'playground'],
    },
    fmt: {
        ...fmt,
        ignorePatterns: ['docs/**', 'packages/cli/templates/**'],
    },
    lint: {
        extends: [lint],
        ignorePatterns: ['docs/**', '**/.vitepress/**', 'packages/cli/templates/**'],
    },
});
