import Aerogel from 'virtual:aerogel';

import { defineServiceState } from '@/services/Service';
import type { Plugin } from '@/plugins/Plugin';

export default defineServiceState({
    name: 'app',
    initialState: {
        plugins: {} as Record<string, Plugin>,
        environment: Aerogel.environment,
        sourceUrl: Aerogel.sourceUrl,
    },
    computed: {
        development: (state) => state.environment === 'development',
        testing: (state) => state.environment === 'test' || state.environment === 'testing',
    },
});
