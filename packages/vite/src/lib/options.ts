export interface Options {
    name?: string;
    description?: string;
    themeColor?: string;
    icons?: Record<string, string>;
    static404Redirect?: boolean | string;
}

export interface AppInfo {
    name: string;
    basePath: string;
    description?: string;
    sourceUrl?: string;
}
