import '@total-typescript/ts-reset';

import { bootstrapApplication } from '@aerogel/core';

import './assets/styles/main.css';
import App from './App.vue';
import { routes } from './pages';

bootstrapApplication(App, {
    routes,
    models: import.meta.glob('@/models/*', { eager: true }),
});
