import { mock, tap, toString } from '@noeldemartin/utils';
import { beforeEach, vi } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
tap(globalThis, (global: any) => {
    const localStorage: Record<string, string> = {};

    global.jest = vi;
    global.navigator = { languages: ['en'] };
    global.localStorage = mock<Storage>({
        getItem: (key) => localStorage[key] ?? null,
        setItem(key, value) {
            localStorage[key] = toString(value);
        },
    });
});

vi.mock('dompurify', async () => {
    return { default: { sanitize: (html: string) => html } };
});

beforeEach(() => {
    vi.stubGlobal('document', {
        querySelector: () => null,
        getElementById: () => null,
    });
});
