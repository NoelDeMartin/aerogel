import Build from 'virtual:aerogel';

import { defineServiceState } from '@/services/Service';
import type { Plugin } from '@/plugins/Plugin';

export default defineServiceState({
    name: 'app',
    initialState: {
        plugins: {} as Record<string, Plugin>,
        environment: Build.environment,
        sourceUrl: Build.sourceUrl,
        isMounted: false,
    },
    computed: {
        development: (state) => state.environment === 'development',
        testing: (state) => state.environment === 'testing',
    },
});
