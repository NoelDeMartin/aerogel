import Vue from '@vitejs/plugin-vue';
import { existsSync, readFileSync } from 'fs';
import { objectWithoutEmpty } from '@noeldemartin/utils';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';
import type { ComponentResolver } from 'unplugin-vue-components';
import type { Plugin } from 'vite';

import { generate404Assets } from '@/lib/404';
import { guessMediaType } from '@/lib/media-types';
import { renderHTML } from '@/lib/html';
import type { AppInfo, Options } from '@/lib/options';

function parseSourceUrl(packageJsonPath: string): string | undefined {
    if (!existsSync(packageJsonPath)) {
        return;
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath).toString()) as {
        repository?: string | { type: string; url: string };
    };

    if (!packageJson.repository) {
        return;
    }

    if (typeof packageJson.repository === 'object') {
        return packageJson.repository.url.replace(`.${packageJson.repository.type}`, '');
    }

    return packageJson.repository?.replace('github:', 'https://github.com/');
}

export function AerogelResolver(): ComponentResolver {
    return {
        type: 'component',
        resolve: (name) => {
            if (!name.startsWith('AG')) {
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
    const appInfo: AppInfo = {
        basePath: '/',
        baseUrl: options.baseUrl,
        name: options.name ?? 'App',
        themeColor: options.themeColor ?? '#ffffff',
        description: options.description,
    };
    const AerogelPlugin: Plugin = {
        name: 'vite:aerogel',
        buildStart(buildOptions) {
            if (!Array.isArray(buildOptions.input) || !buildOptions.input[0]) {
                return;
            }

            appInfo.sourceUrl = parseSourceUrl(resolve(buildOptions.input[0], '../package.json'));
        },
        configureServer(server) {
            server.watcher.on('ready', () => {
                appInfo.baseUrl = server.resolvedUrls?.local?.[0] ?? appInfo.baseUrl;
            });

            appInfo.sourceUrl = parseSourceUrl(`${server.config.root}/package.json`);
        },
        config: (config) => {
            appInfo.basePath = config.base ?? appInfo.basePath;
            config.optimizeDeps = config.optimizeDeps ?? {};
            config.optimizeDeps.exclude = [...(config.optimizeDeps.exclude ?? []), 'virtual:aerogel'];

            return config;
        },
        generateBundle() {
            generate404Assets(this, appInfo, options);
        },
        load(id) {
            if (id !== 'virtual:aerogel') {
                return;
            }

            return `export default ${JSON.stringify({
                environment: process.env.NODE_ENV ?? 'development',
                basePath: appInfo.basePath,
                sourceUrl: appInfo.sourceUrl,
            })};`;
        },
        resolveId(id) {
            if (id !== 'virtual:aerogel') {
                return;
            }

            return id;
        },
        transformIndexHtml: (html, context) => renderHTML(html, context.filename, { app: appInfo }),
    };

    return [
        Vue(),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: objectWithoutEmpty({
                name: appInfo.name,
                short_name: appInfo.name,
                description: appInfo.description,
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
        }),
        AerogelPlugin,
    ].flat();
}
