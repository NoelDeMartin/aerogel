import type { Plugin } from './Plugin';

export * from './Plugin';

export function definePlugin<T extends Plugin>(plugin: T): T {
    return plugin;
}
