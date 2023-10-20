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
        isDevelopment: (state) => state.environment === 'development',
        isTesting: (state) => state.environment === 'testing',
    },
});
