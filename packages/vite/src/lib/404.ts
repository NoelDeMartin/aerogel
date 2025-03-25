import Mustache from 'mustache';
import type { PluginContext } from 'rollup';

import type { AppInfo, Options } from '@aerogel/vite/lib/options';

import static404RedirectHTML from '../templates/404.html?raw';

export function generate404Assets(context: PluginContext, app: AppInfo, options: Options): void {
    const static404Redirect = options.static404Redirect ?? process.env.NODE_ENV === 'production';

    if (options.lib || !static404Redirect) {
        return;
    }

    context.emitFile({
        type: 'asset',
        fileName: typeof options.static404Redirect === 'string' ? options.static404Redirect : '404.html',
        source: Mustache.render(static404RedirectHTML, { app }),
    });
}
