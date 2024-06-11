export interface Options {
    name?: string;
    description?: string;
    themeColor?: string;
    icons?: Record<string, string>;
    baseUrl?: string;
    static404Redirect?: boolean | string;
}

export interface AppInfo {
    name: string;
    version: string;
    basePath: string;
    themeColor: string;
    sourceHash: string;
    description?: string;
    baseUrl?: string;
    sourceUrl?: string;
    plugins?: string[];
}
