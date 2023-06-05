import type { RouteRecordRaw } from 'vue-router';

import Content from './Content.vue';
import Home from './Home.vue';
import Modals from './modals/Modals.vue';
import Storage from './Storage.vue';

export const routes: RouteRecordRaw[] = [
    {
        name: 'home',
        path: '/',
        component: Home,
    },
    {
        name: 'content',
        path: '/content',
        component: Content,
    },
    {
        name: 'modals',
        path: '/modals',
        component: Modals,
    },
    {
        name: 'storage',
        path: '/storage',
        component: Storage,
    },
];
