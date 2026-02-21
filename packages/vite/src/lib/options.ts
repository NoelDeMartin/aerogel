import type { ManifestEntry } from 'workbox-build';
import type { ClientIDDocument } from '@aerogel/vite/lib/solid';
import type { IconResource } from 'vite-plugin-pwa';

export interface Options {
    lib?: boolean;
    name?: string;
    description?: string;
    themeColor?: string;
    icons?: Record<string, string> | IconResource[];
    baseUrl?: string;
    soukaiBis?: boolean;
    patchZodWithSoukaiBis?: boolean;
    static404Redirect?: boolean | string;
    solidClientId?: boolean | ClientIDDocument;
    pwa?: {
        development?: boolean;
        includeAssets?: string[];
        additionalManifestEntries?: ManifestEntry[];
    };
}

export interface AppInfo {
    name: string;
    version: string;
    basePath: string;
    themeColor: string;
    sourceHash: string;
    additionalManifestEntries: ManifestEntry[];
    description?: string;
    baseUrl?: string;
    sourceUrl?: string;
    plugins?: string[];
    locales?: Record<string, string>;
}
