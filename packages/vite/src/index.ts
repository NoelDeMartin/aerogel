import { resolve } from 'node:path';
import type { VirtualAerogel } from 'virtual:aerogel';

import TailwindCSS from '@tailwindcss/vite';
import Vue from '@vitejs/plugin-vue';
import { after, arrayFilter, objectWithoutEmpty } from '@noeldemartin/utils';
import { VitePWA } from 'vite-plugin-pwa';
import type { Plugin } from 'vite';

import { generate404Assets } from '@aerogel/vite/lib/404';
import { generateSolidAssets, generateSolidVirtualModule, solidMiddleware } from '@aerogel/vite/lib/solid';
import { getSourceHash } from '@aerogel/vite/lib/git';
import { guessMediaType } from '@aerogel/vite/lib/media-types';
import { loadLocales } from '@aerogel/vite/lib/lang';
import { loadPackageInfo } from '@aerogel/vite/lib/package-parser';
import { renderHTML } from '@aerogel/vite/lib/html';
import type { AppInfo, Options } from '@aerogel/vite/lib/options';
import type { ClientIDDocument } from '@aerogel/vite/lib/solid';

export type { Options, AppInfo, ClientIDDocument };

export * from './resolvers';

export default function Aerogel(options: Options = {}): Plugin[] {
    const app: AppInfo = {
        name: options.name ?? 'App',
        version: '?',
        sourceHash: getSourceHash(),
        description: options.description,
        basePath: '/',
        baseUrl: process.env.AEROGEL_BASE_URL ?? options.baseUrl,
        themeColor: options.themeColor ?? '#ffffff',
        additionalManifestEntries: options.pwa?.additionalManifestEntries ?? [],
    };
    const virtualHandlers: Record<string, () => string> = {
        'virtual:aerogel'() {
            const virtual: VirtualAerogel = {
                name: app.name,
                version: app.version,
                sourceHash: app.sourceHash,
                basePath: app.basePath,
                sourceUrl: app.sourceUrl,
                locales: app.locales ?? { en: 'English' },
                soukaiBis: options.soukaiBis ?? false,
            };

            return `export default ${JSON.stringify(virtual)};`;
        },
        'virtual:aerogel-solid': () => generateSolidVirtualModule(app, options),
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

                app.baseUrl = server.resolvedUrls?.network?.[0] ?? server.resolvedUrls?.local?.[0] ?? app.baseUrl;
            });

            server.middlewares.use(solidMiddleware(app, options));

            loadPackageInfo(app, `${server.config.root}/package.json`);
            loadLocales(app, `${server.config.root}/src/lang/locales.json`);
        },
        config: (config) => {
            app.basePath = config.base ?? app.basePath;
            config.optimizeDeps = config.optimizeDeps ?? {};
            config.optimizeDeps.exclude = [...(config.optimizeDeps.exclude ?? []), ...Object.keys(virtualHandlers)];
            config.optimizeDeps.include = [...(config.optimizeDeps.include ?? []), 'soukai-bis/patch-zod'];

            config.define = {
                ...(config.define ?? {}),
                __AEROGEL_ENV__: JSON.stringify(process.env.NODE_ENV),
            };

            return config;
        },
        generateBundle() {
            generate404Assets(this, app, options);
            generateSolidAssets(this, app, options);
        },
        load(id) {
            if (id in virtualHandlers) {
                return virtualHandlers[id]?.();
            }

            if (id === 'virtual:soukai-bis/patch-zod') {
                return 'import \'soukai-bis/patch-zod\';';
            }
        },
        resolveId(id) {
            if (id in virtualHandlers) {
                return id;
            }

            if (id.startsWith('/_virtual/')) {
                return `virtual:${id.slice(10)}`;
            }
        },
        transformIndexHtml: {
            order: 'pre',
            handler: (html, context) => ({
                html: renderHTML(html, context.filename, app),
                tags: arrayFilter([
                    options.soukaiBis && {
                        tag: 'script',
                        attrs: { type: 'module', src: '/_virtual/soukai-bis/patch-zod' },
                        injectTo: 'head-prepend',
                    },
                ]),
            }),
        },
    };

    return arrayFilter([
        Vue(),
        TailwindCSS(),
        !options.lib &&
            VitePWA({
                // TODO include default icon in order to have PWA
                registerType: 'autoUpdate',
                devOptions: { enabled: options.pwa?.development ?? false },
                includeAssets: [
                    'apple-touch-icon.png',
                    'favicon-32x32.png',
                    'favicon-16x16.png',
                    'safari-pinned-tab.svg',
                    ...(options.pwa?.includeAssets ?? []),
                ],
                manifest: objectWithoutEmpty({
                    name: app.name,
                    short_name: app.name,
                    description: app.description,
                    theme_color: options.themeColor,
                    icons:
                        options.icons &&
                        (Array.isArray(options.icons)
                            ? options.icons.map((icon) => ({
                                ...icon,
                                type: icon.type ?? guessMediaType(icon.src) ?? undefined,
                            }))
                            : Object.entries(options.icons).map(([sizes, src]) =>
                                objectWithoutEmpty({
                                    src,
                                    sizes,
                                    type: guessMediaType(src) ?? undefined,
                                }))),
                }),
                workbox: {
                    maximumFileSizeToCacheInBytes: 10000000,
                    additionalManifestEntries: app.additionalManifestEntries,
                },
            }),
        AerogelPlugin,
    ]).flat();
}
