import { defineConfig } from 'vite-plus';

export default defineConfig({
    test: {
        projects: ['packages/*', 'playground'],
    },
    fmt: {
        semi: true,
        singleQuote: true,
        tabWidth: 4,
        printWidth: 120,
        sortImports: true,
        sortTailwindcss: true,
        ignorePatterns: ['docs/**', 'packages/cli/templates/**'],
    },
    lint: {
        ignorePatterns: ['docs/**', '**/.vitepress/**', 'packages/cli/templates/**'],
        options: {
            typeAware: true,
            typeCheck: true,
        },
        rules: {
            'no-console': 'error',
            'no-unused-expressions': 'off',
            'no-unused-vars': ['error', { argsIgnorePattern: '^_+$' }],
            'typescript/consistent-type-imports': 'error',
            'typescript/explicit-module-boundary-types': 'error',
            'typescript/no-explicit-any': ['warn', { ignoreRestArgs: true }],
            'typescript/no-base-to-string': 'off',
            'typescript/no-unsafe-declaration-merging': 'off',
            'typescript/restrict-template-expressions': 'off',
        },
        overrides: [
            {
                files: ['**/*.test.ts'],
                rules: {
                    'typescript/no-duplicate-type-constituents': 'off',
                    'typescript/unbound-method': 'off',
                },
            },
        ],
    },
});
