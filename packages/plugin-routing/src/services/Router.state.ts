import { defineServiceState } from '@aerogel/core';
import type { RouteLocationRaw } from 'vue-router';

export default defineServiceState({
    name: 'router',
    initialState: {
        flashRoute: null as RouteLocationRaw | null,
    },
    persist: ['flashRoute'],
});
