import type { StorybookConfig } from '@storybook/vue3-vite';

const config: StorybookConfig = {
    stories: ['../src/**/*.stories.ts'],

    // TODO strip down even more than essentials?
    addons: ['@storybook/addon-essentials', '@storybook/addon-styling'],

    framework: '@storybook/vue3-vite',
    core: { disableTelemetry: true },
};

export default config;
