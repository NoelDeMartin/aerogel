import type { App } from 'vue';

import type { Plugin } from '@/plugins';

export interface AerogelOptions {
    plugins?: Plugin[];
    install?(app: App): void | Promise<void>;
}
