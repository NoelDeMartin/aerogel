import type { RouteRecordRaw } from 'vue-router';

import Content from './Content.vue';
import Forms from './Forms.vue';
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
        name: 'forms',
        path: '/forms',
        component: Forms,
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
