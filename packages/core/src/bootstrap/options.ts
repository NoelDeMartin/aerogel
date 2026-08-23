import type { App } from 'vue';

import type { Plugin } from '@aerogel/core/plugins';
import type { EnvConfig } from '@aerogel/core/utils/env';

export interface AerogelOptions {
    env?: EnvConfig;
    plugins?: Plugin[];
    install?(app: App): void | Promise<void>;
}
