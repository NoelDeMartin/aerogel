import { defineSettings } from '@aerogel/core';

import PurgeData from './PurgeData.vue';
import PurgeMetadata from './PurgeMetadata.vue';

export default defineSettings([
    {
        priority: 1,
        component: PurgeMetadata,
        development: true,
    },
    {
        priority: 0,
        component: PurgeData,
        development: true,
    },
]);

