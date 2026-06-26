import { defineSettings } from '@aerogel/core';

import ClearCache from './ClearCache.vue';
import PurgeData from './PurgeData.vue';

export default defineSettings([
    {
        priority: 1,
        component: ClearCache,
        development: true,
    },
    {
        priority: 0,
        component: PurgeData,
        development: true,
    },
]);
