import '@total-typescript/ts-reset';
import { bootstrapApplication } from '@aerogel/core';

import './assets/styles.css';
import App from './App.vue';

bootstrapApplication(App, {
    models: import.meta.glob('@/models/*', { eager: true }),
});
