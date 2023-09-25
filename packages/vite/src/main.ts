import Vue from '@vitejs/plugin-vue';
import { render } from 'mustache';
import type { ComponentResolver } from 'unplugin-vue-components';
import type { Plugin } from 'vite';

import static404RedirectHTML from './templates/404.html';

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

            return { name, as: name, from: '@aerogel/core' };
        },
    };
}

export default function Aerogel(options: Options = {}): Plugin[] {
    let basePath: string | undefined;

    return [
        Vue(),
        {
            name: 'vite:aerogel',
            config: (config) => {
                basePath = config.base;
                config.define = {
                    ...config.define,
                    __AG_BASE_PATH: basePath ? JSON.stringify(basePath) : 'undefined',
                    __AG_ENV: JSON.stringify(process.env.NODE_ENV ?? 'development'),
                };

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
        },
    ];
}
