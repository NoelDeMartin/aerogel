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
    description?: string;
    basePath: string;
    baseUrl?: string;
    sourceUrl?: string;
    themeColor: string;
    plugins?: string[];
}
