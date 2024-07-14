import { mock, tap } from '@noeldemartin/utils';
import { beforeEach, vi } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
tap(globalThis, (global: any) => {
    global.jest = vi;
    global.navigator = { languages: ['en'] };
    global.localStorage = mock<Storage>({
        getItem: () => null,
        setItem: () => null,
    });
});

beforeEach(() => {
    vi.stubGlobal('document', {
        querySelector: () => null,
        getElementById: () => null,
    });
});
