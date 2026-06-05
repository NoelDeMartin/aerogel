import { defineServiceState } from '@aerogel/core/services/utils';

const hasNavigator = typeof navigator !== 'undefined';

export default defineServiceState({
    name: 'browser',
    initialState: () => ({
        supportsWakeLocking: hasNavigator && 'wakeLock' in navigator,
    }),
});
