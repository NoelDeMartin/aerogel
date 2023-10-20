import Build from 'virtual:aerogel';

import type { Plugin } from '@aerogel/core';
import type { RouteRecordRaw } from 'vue-router';

import { createAppRouter } from './router';

interface Options {
    routes: RouteRecordRaw[];
    basePath?: string;
}

export default function routing(options: Options): Plugin {
    return {
        install(app) {
            const plugin = createAppRouter({
                routes: options.routes,
                basePath: options.basePath ?? Build.basePath,
            });

            app.use(plugin);
        },
    };
}
