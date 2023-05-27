import type { RouteRecordRaw } from 'vue-router';

import HomePage from './HomePage.vue';
import ModelsPage from './ModelsPage.vue';

export const routes: RouteRecordRaw[] = [
    {
        name: 'home',
        path: '/',
        component: HomePage,
    },
    {
        name: 'models',
        path: '/models',
        component: ModelsPage,
    },
];
