import type { App } from 'vue';

import type { AerogelOptions } from '@aerogel/core/bootstrap/options';

export interface Plugin {
    name?: string;
    install(app: App, options: AerogelOptions): void | Promise<void>;
}
