import type { RouteRecordRaw } from 'vue-router';

import Home from './Home.vue';
import Persistence from './Persistence.vue';

export const routes: RouteRecordRaw[] = [
    {
        name: 'home',
        path: '/',
        component: Home,
    },
    {
        name: 'persistence',
        path: '/persistence',
        component: Persistence,
    },
];
