import i18n from '@aerogel/plugin-i18n';
import { bootstrapApplication } from '@aerogel/core';

import './assets/styles.css';
import App from './App.vue';

bootstrapApplication(App, {
    plugins: [i18n({ messages: import.meta.glob('@/lang/*.yaml') })],
});
