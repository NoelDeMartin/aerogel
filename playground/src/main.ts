import '@total-typescript/ts-reset';
import { bootstrap } from '@aerogel/core';
import i18n from '@aerogel/plugin-i18n';
import localFirst from '@aerogel/plugin-local-first';
import routing from '@aerogel/plugin-routing';
import solid from '@aerogel/plugin-solid';

import './assets/css/main.css';
import App from './App.vue';
import { routes } from './pages';
import { services } from './services';

await bootstrap(App, {
    services,
    plugins: [routing({ routes }), i18n(), solid(), localFirst()],
});
