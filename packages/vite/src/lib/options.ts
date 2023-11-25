export interface Options {
    name?: string;
    static404Redirect?: boolean | string;
}

export interface AppInfo {
    name: string;
    basePath: string;
    sourceUrl?: string;
}
