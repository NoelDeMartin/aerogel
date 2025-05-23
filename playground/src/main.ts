import '@total-typescript/ts-reset';

import i18n from '@aerogel/plugin-i18n';
import localFirst from '@aerogel/plugin-local-first';
import routing from '@aerogel/plugin-routing';
import solid from '@aerogel/plugin-solid';
import soukai from '@aerogel/plugin-soukai';
import { bootstrap } from '@aerogel/core';

import './assets/css/main.css';
import App from './App.vue';
import { routes } from './pages';
import { services } from './services';

bootstrap(App, {
    services,
    plugins: [
        routing({ routes }),
        i18n({ messages: import.meta.glob('@/lang/*.yaml') }),
        soukai({ models: import.meta.glob(['@/models/*', '!**/*.test.ts'], { eager: true }) }),
        solid(),
        localFirst(),
    ],
});
