import { defineSettings } from '@aerogel/core/services';

import Debug from './Debug.vue';

export default defineSettings([
    {
        priority: 10,
        component: Debug,
    },
]);
