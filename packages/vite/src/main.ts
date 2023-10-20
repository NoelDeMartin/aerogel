import Vue from '@vitejs/plugin-vue';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { render } from 'mustache';
import type { ComponentResolver } from 'unplugin-vue-components';
import type { Plugin } from 'vite';

import static404RedirectHTML from './templates/404.html';

function parseSourceUrl(packageJsonPath: string): string | undefined {
    if (!existsSync(packageJsonPath)) {
        return;
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath).toString()) as { repository?: string };

    return packageJson.repository?.replace('github:', 'https://github.com/');
}

export interface Options {
    name?: string;
    static404Redirect?: boolean | string;
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
    let basePath: string | undefined;
    let sourceUrl: string | undefined;

    return [
        Vue(),
        {
            name: 'vite:aerogel',
            configureServer(server) {
                sourceUrl = parseSourceUrl(`${server.config.root}/package.json`);
            },
            buildStart(buildOptions) {
                if (!Array.isArray(buildOptions.input) || !buildOptions.input[0]) {
                    return;
                }

                sourceUrl = parseSourceUrl(resolve(buildOptions.input[0], '../package.json'));
            },
            config: (config) => {
                basePath = config.base;
                config.optimizeDeps = config.optimizeDeps ?? {};
                config.optimizeDeps.exclude = [...(config.optimizeDeps.exclude ?? []), 'virtual:aerogel'];

                return config;
            },
            generateBundle() {
                const static404Redirect = options.static404Redirect ?? false;

                if (!static404Redirect) {
                    return;
                }

                this.emitFile({
                    type: 'asset',
                    fileName: typeof static404Redirect === 'string' ? static404Redirect : '404.html',
                    source: render(static404RedirectHTML, {
                        app: {
                            name: options.name ?? 'App',
                            basePath: basePath ?? '/',
                        },
                    }),
                });
            },
            resolveId(id) {
                if (id !== 'virtual:aerogel') {
                    return;
                }

                return id;
            },
            load(id) {
                if (id !== 'virtual:aerogel') {
                    return;
                }

                return `export default ${JSON.stringify({
                    environment: process.env.NODE_ENV ?? 'development',
                    basePath,
                    sourceUrl,
                })};`;
            },
        },
    ];
}
