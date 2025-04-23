import { defineSettings } from '@aerogel/core/services';

import Debug from './Debug.vue';
import Language from './Language.vue';

export default defineSettings([
    {
        priority: 10,
        component: Debug,
    },
    {
        priority: 100,
        component: Language,
    },
]);
