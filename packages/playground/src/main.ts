import '@total-typescript/ts-reset';

import i18n from '@aerogel/plugin-i18n';
import routing from '@aerogel/plugin-routing';
import solid from '@aerogel/plugin-solid';
import soukai from '@aerogel/plugin-soukai';
import { bootstrapApplication } from '@aerogel/core';

import './assets/styles.css';
import App from './App.vue';
import { components } from './components';
import { routes } from './pages';
import { services } from './services';

bootstrapApplication(App, {
    services,
    components,
    plugins: [
        routing({ routes }),
        i18n({ messages: import.meta.glob('@/lang/*.yaml') }),
        soukai({ models: import.meta.glob('@/models/*', { eager: true }) }),
        solid(),
    ],
});
