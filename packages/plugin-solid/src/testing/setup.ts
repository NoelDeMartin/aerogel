import 'soukai-bis/patch-zod';

import { FakeLocalStorage } from '@noeldemartin/testing';
import { vi } from 'vitest';

vi.mock('@aerogel/core', async () => {
    const original = (await vi.importActual('@aerogel/core')) as object;

    FakeLocalStorage.reset();
    FakeLocalStorage.patchGlobal();

    return original;
});
