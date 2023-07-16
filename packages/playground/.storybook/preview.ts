/// <reference types="vite/client" />

import { setupStorybook } from '@aerogel/plugin-i18n';
import { setup } from '@storybook/vue3';

import '../src/assets/styles.css';

setup((app) => {
    const langFile = Object.values(import.meta.glob('@/lang/en.yaml', { eager: true }))[0] as {
        default: Record<string, unknown>;
    };
    const messages = langFile?.default;

    setupStorybook(app, messages);
});
