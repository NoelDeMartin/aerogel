import { defineSettings } from '@aerogel/core/utils/settings';
import { defineAsyncComponent } from 'vue';

export default defineSettings([
    {
        priority: 1,
        component: defineAsyncComponent(() => import('./ClearCache.vue')),
        development: true,
    },
]);
