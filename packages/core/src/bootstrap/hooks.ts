import type { App } from 'vue';

import type { BootstrapOptions } from '@/bootstrap/options';

const mountedHooks: Function[] = [];

export type BootstrapHook = (app: App, options: BootstrapOptions) => Promise<void>;

export function onAppMounted(hook: Function): void {
    mountedHooks.push(hook);
}

export function runAppMountedHooks(): void {
    mountedHooks.forEach((hook) => hook());
}

export function defineBootstrapHook<T extends BootstrapHook>(hook: T): T {
    return hook;
}
