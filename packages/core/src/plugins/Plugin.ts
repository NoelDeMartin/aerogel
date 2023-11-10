import type { App } from 'vue';

import type { AerogelOptions } from '@/bootstrap/options';

export interface Plugin {
    name?: string;
    install(app: App, options: AerogelOptions): void | Promise<void>;
}
