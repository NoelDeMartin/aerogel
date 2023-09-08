import { defineServiceState } from '@/services/Service';

export default defineServiceState({
    initialState: {
        environment: __AG_ENV,
        isMounted: false,
    },
    computed: {
        isDevelopment: (state) => state.environment === 'development',
        isTesting: (state) => state.environment === 'testing',
    },
});
