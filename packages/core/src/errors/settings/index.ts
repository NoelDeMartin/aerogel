import { defineSettings } from '@aerogel/core/utils/settings';

import DeveloperMode from './DeveloperMode.vue';

export default defineSettings([
    {
        priority: 10,
        component: DeveloperMode,
    },
]);
