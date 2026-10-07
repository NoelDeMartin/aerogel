import '@total-typescript/ts-reset';
import { bootstrap } from '@aerogel/core';
import i18n from '@aerogel/plugin-i18n';
import localFirst from '@aerogel/plugin-local-first';
import routing from '@aerogel/plugin-routing';
import solid from '@aerogel/plugin-solid';

import './assets/css/main.css';

export default await bootstrap(
    { template: '<div />' },
    {
        plugins: [i18n(), routing({ routes: [] }), solid(), localFirst()],
    },
);
