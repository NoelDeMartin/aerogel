import Aerogel from 'virtual:aerogel';

import { defineServiceState } from '@/services/Service';
import type { Plugin } from '@/plugins/Plugin';

export default defineServiceState({
    name: 'app',
    initialState: {
        plugins: {} as Record<string, Plugin>,
        environment: Aerogel.environment,
        sourceUrl: Aerogel.sourceUrl,
        isMounted: false,
    },
    computed: {
        development: (state) => state.environment === 'development',
        testing: (state) => state.environment === 'testing',
    },
});
