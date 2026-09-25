import type { ManifestEntry } from 'workbox-build';
import type { ClientIDDocument } from '@aerogel/vite/lib/solid';

export interface Options {
    lib?: boolean;
    name?: string;
    description?: string;
    themeColor?: string;
    generateIcons?: boolean;
    baseUrl?: string;
    developmentHost?: string;
    static404Redirect?: boolean | string;
    solidClientId?: boolean | ClientIDDocument;
    pwa?: {
        development?: boolean;
        includeAssets?: string[];
        additionalManifestEntries?: ManifestEntry[];
    } | false;
}

export interface AppInfo {
    name: string;
    version: string;
    basePath: string;
    cacheDir: string;
    themeColor: string;
    sourceHash: string;
    additionalManifestEntries: ManifestEntry[];
    description?: string;
    baseIconPath?: string;
    baseUrl?: string;
    developmentHost?: string;
    sourceUrl?: string;
    plugins?: string[];
    locales?: Record<string, string>;
}
