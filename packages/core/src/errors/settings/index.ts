import { defineSettings } from '@aerogel/core/services';

import DeveloperMode from './DeveloperMode.vue';

export default defineSettings([
    {
        priority: 10,
        component: DeveloperMode,
    },
]);
