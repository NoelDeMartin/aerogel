import { tap } from '@noeldemartin/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
tap(globalThis, (global: any) => {
    global.navigator = { languages: ['en'] };
});
