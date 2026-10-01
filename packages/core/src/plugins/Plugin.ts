import type { AerogelOptions } from '@aerogel/core/bootstrap/options';
import type { App } from 'vue';

export interface Plugin {
    name?: string;
    install(app: App, options: AerogelOptions): void | Promise<void>;
}
