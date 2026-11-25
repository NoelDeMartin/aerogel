import Events from '@aerogel/core/services/Events';
import FakeCacheStorage from '@aerogel/core/testing/stubs/FakeCacheStorage';
import { FakeLocalStorage } from '@noeldemartin/testing';
import { beforeEach, vi } from 'vite-plus/test';

vi.mock('dompurify', async () => {
    return { default: { sanitize: (html: string) => html } };
});

beforeEach(() => {
    Events.reset();
    FakeLocalStorage.reset();
    FakeLocalStorage.patchGlobal();

    vi.restoreAllMocks();
    vi.stubGlobal('caches', new FakeCacheStorage());

    document.body.innerHTML = '';
});
