import { resolve } from 'node:path';

import { generate404Assets } from '@aerogel/vite/lib/404';
import { buildComponentsPlugin } from '@aerogel/vite/lib/components';
import {
    configureAliases,
    configureBuild,
    configureCodeSplitting,
    configureDependencies,
    configureDevelopmentHost,
    configureEnvironment,
    configurePublicDir,
    configureTests,
    configureWorkers,
} from '@aerogel/vite/lib/config';
import { getSourceHash } from '@aerogel/vite/lib/git';
import { renderHTML } from '@aerogel/vite/lib/html';
import { buildI18nPlugin, generateMessagesVirtualModule } from '@aerogel/vite/lib/i18n';
import {
    buildIconsPlugin,
    generateIconAssets,
    getManifestIcons,
    iconsMiddleware,
    resolveIconSource,
} from '@aerogel/vite/lib/icons';
import { loadLocales } from '@aerogel/vite/lib/lang';
import type { AppInfo, Options } from '@aerogel/vite/lib/options';
import { loadPackageInfo } from '@aerogel/vite/lib/package-parser';
import { buildPWAPlugin } from '@aerogel/vite/lib/pwa';
import { generateSolidAssets, generateSolidVirtualModule, solidMiddleware } from '@aerogel/vite/lib/solid';
import type { ClientIDDocument } from '@aerogel/vite/lib/solid';
import {
    generateModelsVirtualModule,
    generateModelsWorkerVirtualModule,
    generatePatchZodVirtualModule,
} from '@aerogel/vite/lib/soukai';
import { generateSetupVitestVirtualModule } from '@aerogel/vite/lib/testing';
import { stripQuery } from '@aerogel/vite/lib/urls';
import { after, arrayFilter, objectWithoutEmpty } from '@noeldemartin/utils';
import TailwindCSS from '@tailwindcss/vite';
import Vue from '@vitejs/plugin-vue';
import VueJsx from '@vitejs/plugin-vue-jsx';
import type { VirtualAerogel } from 'virtual:aerogel';
import type { Plugin } from 'vite';
import type { ManifestOptions } from 'vite-plugin-pwa';

export type { Options, AppInfo, ClientIDDocument };

export * from './resolvers';

export default function Aerogel(options: Options = {}): Plugin[] {
    const app: AppInfo = {
        name: options.name ?? 'App',
        root: resolve(process.cwd()),
        version: '?',
        sourceHash: getSourceHash(),
        description: options.description,
        basePath: '/',
        cacheDir: 'node_modules/.vite',
        baseUrl: process.env.AEROGEL_BASE_URL ?? options.baseUrl,
        developmentHost: options.developmentHost,
        themeColor: options.themeColor ?? '#ffffff',
        additionalManifestEntries: options.pwa ? (options.pwa.additionalManifestEntries ?? []) : [],
    };
    const manifest: Partial<ManifestOptions> = objectWithoutEmpty({
        name: app.name,
        short_name: app.name,
        description: app.description,
        theme_color: options.themeColor,
    });
    const virtualHandlers: Record<string, () => string> = {
        'virtual:aerogel'() {
            const virtual: VirtualAerogel = {
                name: app.name,
                version: app.version,
                sourceHash: app.sourceHash,
                basePath: app.basePath,
                sourceUrl: app.sourceUrl,
                locales: app.locales ?? { en: 'English' },
            };

            return `export default ${JSON.stringify(virtual)};`;
        },
        'virtual:aerogel-solid': () => generateSolidVirtualModule(app, options),
        'virtual:aerogel-models': () => generateModelsVirtualModule(),
        'virtual:aerogel-models-worker': () => generateModelsWorkerVirtualModule(),
        'virtual:aerogel-messages': () => generateMessagesVirtualModule(),
        '/_virtual/soukai-bis/patch-zod': () => generatePatchZodVirtualModule(),
        '/_virtual/aerogel-setup-vitest': () => generateSetupVitestVirtualModule(app),
    };
    const AerogelPlugin: Plugin = {
        name: 'vite:aerogel',
        buildStart(buildOptions) {
            if (!Array.isArray(buildOptions.input) || !buildOptions.input[0]) {
                return;
            }

            loadPackageInfo(app, resolve(buildOptions.input[0], '../package.json'));
            loadLocales(app, resolve(buildOptions.input[0], '../src/lang/locales.json'));
        },
        configureServer(server) {
            server.httpServer?.once('listening', async () => {
                await after({ ms: 100 });

                app.baseUrl = options.developmentHost
                    ? `https://${options.developmentHost}/`
                    : (server.resolvedUrls?.network?.[0] ?? server.resolvedUrls?.local?.[0] ?? app.baseUrl);
            });

            server.middlewares.use(iconsMiddleware(app));
            server.middlewares.use(solidMiddleware(app));

            loadPackageInfo(app, `${server.config.root}/package.json`);
            loadLocales(app, `${server.config.root}/src/lang/locales.json`);
        },
        config: (config, { mode }) => {
            app.root = resolve(config.root ?? app.root);
            app.basePath = config.base ?? app.basePath;

            if (!options.lib && options.generateIcons !== false) {
                resolveIconSource(app, app.root);
            }

            if (app.baseIconPath) {
                manifest.icons = getManifestIcons();
            }

            if (!options.lib) {
                loadPackageInfo(app, resolve(app.root, 'package.json'));
                configurePublicDir(config, app.root);
                configureAliases(config, app.root);
            }

            configureBuild(config);
            configureDependencies(config, Object.keys(virtualHandlers));
            configureEnvironment(config, mode);
            configureTests(config, options);
            configureWorkers(config, AerogelPlugin);
            configureDevelopmentHost(config, app);
            configureCodeSplitting(config);

            return config;
        },
        configResolved(config) {
            app.cacheDir = config.cacheDir;
        },
        async generateBundle() {
            await generateIconAssets(this, app);

            generate404Assets(this, app, options);
            generateSolidAssets(this, app);
        },
        load(id) {
            return virtualHandlers[stripQuery(id)]?.();
        },
        resolveId(id) {
            if (!(stripQuery(id) in virtualHandlers)) {
                return;
            }

            return id;
        },
        transform(code, id) {
            if (id.endsWith('.jsonld')) {
                return `export default ${code}`;
            }
        },
        transformIndexHtml: {
            order: 'pre',
            handler: (html, context) => ({
                html: renderHTML(html, context.filename, app),
                tags: [
                    {
                        tag: 'script',
                        attrs: { type: 'module', src: '/_virtual/soukai-bis/patch-zod' },
                        injectTo: 'head-prepend',
                    },
                ],
            }),
        },
    };

    return arrayFilter([
        Vue(),
        VueJsx(),
        TailwindCSS(),
        buildIconsPlugin(options, app),
        buildComponentsPlugin(options),
        buildI18nPlugin(options, app),
        buildPWAPlugin(options, app, manifest),
        AerogelPlugin,
    ]).flat();
}
