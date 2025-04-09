import Aerogel from 'virtual:aerogel';

import { getEnv } from '@noeldemartin/utils';
import type { App, Component } from 'vue';

import { defineServiceState } from '@aerogel/core/services/Service';
import type { Plugin } from '@aerogel/core/plugins/Plugin';

export interface AppSetting {
    component: Component;
    priority: number;
}

export function defineSettings<T extends AppSetting[]>(settings: T): T {
    return settings;
}

export default defineServiceState({
    name: 'app',
    initialState: {
        plugins: {} as Record<string, Plugin>,
        instance: null as App | null,
        environment: getEnv() ?? 'development',
        version: Aerogel.version,
        sourceUrl: Aerogel.sourceUrl,
        settings: [] as AppSetting[],
    },
    computed: {
        development: (state) => state.environment === 'development',
        staging: (state) => state.environment === 'staging',
        testing: (state) => state.environment === 'test' || state.environment === 'testing',
        versionName(state): string {
            if (this.development) {
                return 'dev.' + Aerogel.sourceHash.toString().substring(0, 7);
            }

            if (this.staging) {
                return 'staging.' + Aerogel.sourceHash.toString().substring(0, 7);
            }

            return `v${state.version}`;
        },
        versionUrl(state): string {
            return (
                state.sourceUrl +
                (this.development || this.staging ? `/tree/${Aerogel.sourceHash}` : `/releases/tag/${this.versionName}`)
            );
        },
    },
});
