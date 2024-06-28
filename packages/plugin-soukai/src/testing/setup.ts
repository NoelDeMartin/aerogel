import { mock, setTestingNamespace, tap } from '@noeldemartin/utils';
import { vi } from 'vitest';

setTestingNamespace(vi);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
tap(globalThis, (global: any) => {
    global.navigator = { languages: ['en'] };
    global.window = mock<Window>({
        matchMedia: () =>
            mock<MediaQueryList>({
                addEventListener: () => null,
            }),
    });
});
