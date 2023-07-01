import '@total-typescript/ts-reset';

import routing from '@aerogel/plugin-routing';
import { bootstrapApplication } from '@aerogel/core';

import './assets/styles.css';
import App from './App.vue';
import { routes } from './pages';

bootstrapApplication(App, {
    plugins: [routing({ routes })],
    langMessages: import.meta.glob('@/lang/*.yaml'),
    models: import.meta.glob('@/models/*', { eager: true }),
});
