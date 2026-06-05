import type { Page, Request, Response } from '@playwright/test';

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
    nth(index: number): InterceptedCall | undefined;
};

function matchesUrl(glob: string, url: string): boolean {
    if (glob.endsWith('*')) {
        return url.startsWith(glob.slice(0, -1));
    }

    return url === glob;
}

function matchesRequest(request: Request, glob: string, method?: string): boolean {
    if (method && request.method().toUpperCase() !== method.toUpperCase()) {
        return false;
    }

    return matchesUrl(glob, request.url());
}

export function interceptRequests(page: Page, url: string): InterceptHandle;
export function interceptRequests(page: Page, method: string, url: string): InterceptHandle;
export function interceptRequests(page: Page, methodOrUrl: string, url?: string): InterceptHandle {
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
        nth(index: number) {
            return calls[index - 1];
        },
    };
}
