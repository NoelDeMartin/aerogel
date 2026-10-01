import { FakeLocalStorage } from '@noeldemartin/testing';
import { vi } from 'vite-plus/test';

vi.mock('@aerogel/core', async () => {
    const original = (await vi.importActual('@aerogel/core')) as object;

    FakeLocalStorage.reset();
    FakeLocalStorage.patchGlobal();

    return original;
});
