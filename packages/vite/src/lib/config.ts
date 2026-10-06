import type { AppInfo, Options } from '@aerogel/vite/lib/options';
import { arrayFrom } from '@noeldemartin/utils';
import type { Plugin, Rolldown, UserConfig } from 'vite';

export function configureDependencies(config: UserConfig, virtualModules: string[]): void {
    config.optimizeDeps = config.optimizeDeps ?? {};
    config.optimizeDeps.exclude = [...(config.optimizeDeps.exclude ?? []), ...virtualModules];
    config.optimizeDeps.include = [...(config.optimizeDeps.include ?? []), 'soukai-bis/patch-zod'];

    config.resolve = {
        ...config.resolve,
        dedupe: [...(config.resolve?.dedupe ?? []), 'zod'],
    };
}

export function configureEnvironment(config: UserConfig, mode: string): void {
    config.define = {
        ...config.define,
        __AEROGEL_ENV__: JSON.stringify(mode === 'testing' ? 'testing' : process.env.NODE_ENV),
    };
}

export function configureTests(config: UserConfig, options: Options): void {
    const testInlineDeps = config.test?.server?.deps?.inline;

    if (testInlineDeps !== true) {
        config.test ??= {};
        config.test.server ??= {};
        config.test.server.deps ??= {};
        config.test.server.deps.inline = [
            '@aerogel/core',
            '@aerogel/plugin-routing',
            '@aerogel/plugin-solid',
            ...(testInlineDeps ?? []),
        ];
    }

    if (!options.lib) {
        config.test ??= {};
        config.test.include ??= ['src/**/*.test.ts'];
        config.test.setupFiles = ['/_virtual/aerogel-setup-vitest', ...arrayFrom(config.test.setupFiles ?? [])];
    }
}

export function configureWorkers(config: UserConfig, plugin: Plugin): void {
    const workerPlugins = config.worker?.plugins;

    config.worker = {
        ...config.worker,
        format: config.worker?.format ?? 'es',
        plugins: () => [
            { name: 'vite:aerogel-worker', load: plugin.load, resolveId: plugin.resolveId },
            ...(workerPlugins?.() ?? []),
        ],
    };
}

export function configureDevelopmentHost(config: UserConfig, app: AppInfo): void {
    if (!app.developmentHost) {
        return;
    }

    config.server = {
        allowedHosts: [app.developmentHost],
        hmr: {
            protocol: 'wss',
            host: app.developmentHost,
            clientPort: 443,
        },
    };
}

export function configureCodeSplitting(config: UserConfig): void {
    config.build ??= {};
    config.build.rollupOptions ??= {};

    if (!('rolldownOptions' in config.build)) {
        return;
    }

    const rolldownOptions = config.build.rollupOptions as Rolldown.RolldownOptions;

    if (Array.isArray(rolldownOptions.output)) {
        return;
    }

    rolldownOptions.output ??= {};

    if (typeof rolldownOptions.output.codeSplitting === 'boolean') {
        rolldownOptions.output.codeSplitting = {};
    } else {
        rolldownOptions.output.codeSplitting ??= {};
    }

    rolldownOptions.output.codeSplitting.groups ??= [];
    rolldownOptions.output.codeSplitting.groups.push({
        test: /soukai-bis.*patch-zod/,
        name: 'patch-zod',
    });
}
