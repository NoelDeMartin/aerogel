import Aerogel from 'virtual:aerogel';

import { defineServiceState } from '@/services/Service';
import type { Plugin } from '@/plugins/Plugin';

export default defineServiceState({
    name: 'app',
    initialState: {
        plugins: {} as Record<string, Plugin>,
        environment: Aerogel.environment,
        version: Aerogel.version,
        sourceUrl: Aerogel.sourceUrl,
    },
    computed: {
        development: (state) => state.environment === 'development',
        testing: (state) => state.environment === 'test' || state.environment === 'testing',
        versionName(state): string {
            if (this.development) {
                return 'dev.' + Aerogel.sourceHash.toString().substring(0, 7);
            }

            return `v${state.version}`;
        },
        versionUrl(state): string {
            return (
                state.sourceUrl +
                (this.development ? `/tree/${Aerogel.sourceHash}` : `/releases/tag/${this.versionName}`)
            );
        },
    },
});
