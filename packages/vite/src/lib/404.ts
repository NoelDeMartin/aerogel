import { render } from 'mustache';
import type { PluginContext } from 'rollup';

import type { AppInfo, Options } from '@/lib/options';

import static404RedirectHTML from '../templates/404.html';

export function generate404Assets(context: PluginContext, appInfo: AppInfo, options: Options): void {
    const static404Redirect = options.static404Redirect ?? false;

    if (!static404Redirect) {
        return;
    }

    context.emitFile({
        type: 'asset',
        fileName: typeof options.static404Redirect === 'string' ? options.static404Redirect : '404.html',
        source: render(static404RedirectHTML, { app: appInfo }),
    });
}
