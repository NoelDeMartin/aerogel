import type { StorybookConfig } from '@storybook/vue3-vite';

const config: StorybookConfig = {
    stories: ['../../packages/**/src/**/*.stories.tsx', '../src/**/*.stories.tsx'],
    addons: ['@storybook/addon-docs'],
    framework: {
        name: '@storybook/vue3-vite',
        options: {
            docgen: {
                plugin: 'vue-component-meta',
                tsconfig: 'tsconfig.json',
            },
        },
    },
    core: {
        disableTelemetry: true,
    },
    features: {
        sidebarOnboardingChecklist: false,
    },
};

export default config;
