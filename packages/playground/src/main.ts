import '@total-typescript/ts-reset';

import { bootstrapApplication } from '@aerogel/core';

import './assets/styles/main.css';
import App from './App.vue';
import { routes } from './pages';

bootstrapApplication(App, {
    routes,
    langMessages: import.meta.glob('@/lang/*.yaml'),
    models: import.meta.glob('@/models/*', { eager: true }),
});
