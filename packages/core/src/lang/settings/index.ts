import { defineSettings } from '@aerogel/core/services';

import Language from './Language.vue';

export default defineSettings([
    {
        priority: 100,
        component: Language,
    },
]);
