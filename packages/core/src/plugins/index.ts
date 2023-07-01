import type { App } from 'vue';

export interface Plugin {
    install(app: App): void | Promise<void>;
    onAppMounted?(): void | Promise<void>;
}

export function definePlugin<T extends Plugin>(plugin: T): T {
    return plugin;
}
