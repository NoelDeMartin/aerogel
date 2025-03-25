import type { App } from 'vue';

import type { Plugin } from '@aerogel/core/plugins';

export interface AerogelOptions {
    plugins?: Plugin[];
    install?(app: App): void | Promise<void>;
}
