import { defineRoutes } from '@aerogel/plugin-routing';

import Components from './components/Components.vue';
import Content from './Content.vue';
import Errors from './Errors.vue';
import Forms from './Forms.vue';
import Home from './Home.vue';
import Offline from './offline/Offline.vue';
import Solid from './solid/Solid.vue';
import Storage from './Storage.vue';

export const routes = defineRoutes([
    {
        name: 'home',
        path: '/',
        component: Home,
    },
    {
        name: 'components',
        path: '/components',
        component: Components,
    },
    {
        name: 'content',
        path: '/content',
        component: Content,
    },
    {
        name: 'errors',
        path: '/errors',
        component: Errors,
    },
    {
        name: 'forms',
        path: '/forms',
        component: Forms,
    },
    {
        name: 'storage',
        path: '/storage',
        component: Storage,
    },
    {
        name: 'solid',
        path: '/solid',
        component: Solid,
    },
    {
        name: 'offline',
        path: '/offline',
        component: Offline,
    },
]);
