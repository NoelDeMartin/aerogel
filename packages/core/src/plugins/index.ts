import type { GetClosureArgs } from '@noeldemartin/utils';

import App from '@/services/App';

import type { Plugin } from './Plugin';

export * from './Plugin';

export function definePlugin<T extends Plugin>(plugin: T): T {
    return plugin;
}

export async function installPlugins(plugins: Plugin[], ...args: GetClosureArgs<Plugin['install']>): Promise<void> {
    App.setState(
        'plugins',
        plugins.reduce((pluginsMap, plugin) => {
            if (plugin.name) {
                pluginsMap[plugin.name] = plugin;
            }

            return pluginsMap;
        }, {} as Record<string, Plugin>),
    );

    await Promise.all(plugins.map((plugin) => plugin.install(...args)) ?? []);
}
