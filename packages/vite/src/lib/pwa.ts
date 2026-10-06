import type { AppInfo, Options } from '@aerogel/vite/lib/options';
import type { Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import type { ManifestOptions } from 'vite-plugin-pwa';

export function buildPWAPlugin(options: Options, app: AppInfo, manifest: Partial<ManifestOptions>): Plugin[] | false {
    if (options.lib || options.pwa === false || process.env.STORYBOOK === 'true') {
        return false;
    }

    return VitePWA({
        registerType: 'autoUpdate',
        devOptions: { enabled: options.pwa?.development ?? false },
        includeAssets: options.pwa?.includeAssets,
        manifest,
        workbox: {
            mode: ['production', 'staging'].includes(process.env.NODE_ENV ?? '') ? 'production' : 'development',
            maximumFileSizeToCacheInBytes: 10000000,
            additionalManifestEntries: app.additionalManifestEntries,
        },
    });
}
