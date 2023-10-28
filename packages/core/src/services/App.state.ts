import Build from 'virtual:aerogel';

import { defineServiceState } from '@/services/Service';

export default defineServiceState({
    name: 'app',
    initialState: {
        environment: Build.environment,
        sourceUrl: Build.sourceUrl,
        isMounted: false,
    },
    computed: {
        development: (state) => state.environment === 'development',
        testing: (state) => state.environment === 'testing',
    },
});
