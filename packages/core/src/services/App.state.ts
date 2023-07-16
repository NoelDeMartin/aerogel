import { defineServiceState } from '@/services/Service';

export default defineServiceState({
    initialState: {
        environment: __AG_ENV,
    },
    computed: {
        isDevelopment: (state) => state.environment === 'development',
    },
});
