import i18n from '@aerogel/plugin-i18n';
import soukai from '@aerogel/plugin-soukai';
import { bootstrapApplication } from '@aerogel/core';

import './assets/css/styles.css';
import App from './App.vue';

bootstrapApplication(App, {
    plugins: [
        i18n({ messages: import.meta.glob('@/lang/*.yaml') }),
        soukai({ models: import.meta.glob('@/models/*', { eager: true }) }),
    ],
});
