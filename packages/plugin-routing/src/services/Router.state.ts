import { defineServiceState } from '@aerogel/core';
import type { RouteLocationNormalizedLoaded } from 'vue-router';

export default defineServiceState({
    name: 'router',
    initialState: {
        flashRoute: null as RouteLocationNormalizedLoaded | null,
    },
    persist: ['flashRoute'],
});
