import type { ClientIDDocument } from '@aerogel/vite/lib/solid';

export interface Options {
    lib?: boolean;
    name?: string;
    description?: string;
    themeColor?: string;
    icons?: Record<string, string>;
    baseUrl?: string;
    static404Redirect?: boolean | string;
    solidClientId?: boolean | ClientIDDocument;
}

export interface AppInfo {
    name: string;
    version: string;
    basePath: string;
    themeColor: string;
    sourceHash: string;
    additionalManifestEntries: string[];
    description?: string;
    baseUrl?: string;
    sourceUrl?: string;
    plugins?: string[];
    locales?: Record<string, string>;
}
