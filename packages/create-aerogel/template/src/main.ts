import { bootstrapApplication } from '@aerogel/core';

import App from './App.vue';

bootstrapApplication(App, {
    models: import.meta.glob('@/models', { eager: true }),
});
