import type { App } from 'vue';

import type { AerogelOptions } from '@/bootstrap/options';

export interface Plugin {
    install(app: App, options: AerogelOptions): void | Promise<void>;
    onAppMounted?(): void | Promise<void>;
}
