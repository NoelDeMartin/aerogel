import Vue from '@vitejs/plugin-vue';
import { objectWithoutEmpty } from '@noeldemartin/utils';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';
import type { ComponentResolver } from 'unplugin-vue-components';
import type { Plugin } from 'vite';

import { generate404Assets } from '@/lib/404';
import { generateSolidAssets, generateSolidVirtualModule, solidMiddleware } from '@/lib/solid';
import { getSourceHash } from '@/lib/git';
import { guessMediaType } from '@/lib/media-types';
import { loadPackageInfo } from '@/lib/package-parser';
import { renderHTML } from '@/lib/html';
import type { AppInfo, Options } from '@/lib/options';

import type { VirtualAerogel } from 'virtual:aerogel';

export function AerogelResolver(): ComponentResolver {
    return {
        type: 'component',
        resolve: (name) => {
            if (!name.startsWith('AG') || name.startsWith('AGStory')) {
                return;
            }

            if (name.startsWith('AGSolid')) {
                return { name, as: name, from: '@aerogel/plugin-solid' };
            }

            if (name.startsWith('AGCloud')) {
                return { name, as: name, from: '@aerogel/plugin-offline-first' };
            }

            return { name, as: name, from: '@aerogel/core' };
        },
    };
}

export default function Aerogel(options: Options = {}): Plugin[] {
    const app: AppInfo = {
        name: options.name ?? 'App',
        version: '?',
        sourceHash: getSourceHash(),
        description: options.description,
        basePath: '/',
        baseUrl: options.baseUrl,
        themeColor: options.themeColor ?? '#ffffff',
    };
    const virtualHandlers: Record<string, () => string> = {
        'virtual:aerogel'() {
            const virtual: VirtualAerogel = {
                name: app.name,
                environment: process.env.NODE_ENV ?? 'development',
                version: app.version,
                sourceHash: app.sourceHash,
                basePath: app.basePath,
                sourceUrl: app.sourceUrl,
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
        },
        configureServer(server) {
            server.watcher.on('ready', () => {
                app.baseUrl = server.resolvedUrls?.network?.[0] ?? server.resolvedUrls?.local?.[0] ?? app.baseUrl;
            });

            server.middlewares.use(solidMiddleware(app, options));

            loadPackageInfo(app, `${server.config.root}/package.json`);
        },
        config: (config) => {
            app.basePath = config.base ?? app.basePath;
            config.optimizeDeps = config.optimizeDeps ?? {};
            config.optimizeDeps.exclude = [...(config.optimizeDeps.exclude ?? []), ...Object.keys(virtualHandlers)];

            return config;
        },
        generateBundle() {
            generate404Assets(this, app, options);
            generateSolidAssets(this, app, options);
        },
        load: (id) => virtualHandlers[id]?.(),
        resolveId: (id) => (id in virtualHandlers ? id : undefined),
        transformIndexHtml: (html, context) => renderHTML(html, context.filename, app),
    };

    return [
        Vue(),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: objectWithoutEmpty({
                name: app.name,
                short_name: app.name,
                description: app.description,
                theme_color: options.themeColor,
                icons:
                    options.icons &&
                    Object.entries(options.icons).map(([sizes, src]) =>
                        objectWithoutEmpty({
                            src,
                            sizes,
                            type: guessMediaType(src),
                        })),
            }),
            workbox: {
                maximumFileSizeToCacheInBytes: 10000000,
                additionalManifestEntries: [
                    '/apple-touch-icon.png',
                    '/favicon-32x32.png',
                    '/favicon-16x16.png',
                    '/safari-pinned-tab.svg',
                ],
            },
        }),
        AerogelPlugin,
    ].flat();
}
