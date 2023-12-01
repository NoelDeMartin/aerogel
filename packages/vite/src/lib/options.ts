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
    basePath: string;
    themeColor: string;
    baseUrl?: string;
    description?: string;
    sourceUrl?: string;
}
