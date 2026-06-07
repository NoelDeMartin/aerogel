import type { Page, Request, Response } from '@playwright/test';

export type UrlMatcher = string;

export type InterceptedCall = {
    url: string;
    method: string;
    body: string | null;
    status: number;
    request: Request;
    response: Response;
};

export type InterceptHandle = {
    readonly all: InterceptedCall[];
    slice(start: number, end: number): InterceptedCall[];
    nth(index: number): InterceptedCall | undefined;
    first(url: UrlMatcher): InterceptedCall | undefined;
    matching(url: UrlMatcher): InterceptedCall[];
};

function matchesUrl(glob: UrlMatcher, url: string): boolean {
    if (glob.endsWith('*')) {
        return url.startsWith(glob.slice(0, -1));
    }

    return url === glob;
}

function matchesRequest(request: Request, glob: UrlMatcher, method?: string): boolean {
    if (method && request.method().toUpperCase() !== method.toUpperCase()) {
        return false;
    }

    return matchesUrl(glob, request.url());
}

export function interceptRequests(page: Page, url: UrlMatcher): InterceptHandle;
export function interceptRequests(page: Page, method: string, url: UrlMatcher): InterceptHandle;
export function interceptRequests(page: Page, methodOrUrl: string | UrlMatcher, url?: UrlMatcher): InterceptHandle {
    const method = url === undefined ? undefined : methodOrUrl;
    const glob = url ?? methodOrUrl;
    const calls: InterceptedCall[] = [];

    const onResponse = (response: Response) => {
        const request = response.request();

        if (!matchesRequest(request, glob, method)) {
            return;
        }

        calls.push({
            url: request.url(),
            method: request.method(),
            body: request.postData(),
            status: response.status(),
            request,
            response,
        });
    };

    page.on('response', onResponse);

    return {
        get all() {
            return calls;
        },
        slice(start: number, end: number) {
            return calls.slice(start, end);
        },
        nth(index: number) {
            return calls[index - 1];
        },
        first(urlPattern: UrlMatcher) {
            return calls.find((call) => matchesUrl(urlPattern, call.url));
        },
        matching(urlPattern: UrlMatcher) {
            return calls.filter((call) => matchesUrl(urlPattern, call.url));
        },
    };
}
