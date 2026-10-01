import { FakeLocalStorage } from '@noeldemartin/testing';
import { beforeEach, vi } from 'vite-plus/test';

vi.mock('dompurify', async () => {
    return { default: { sanitize: (html: string) => html } };
});

beforeEach(() => {
    FakeLocalStorage.reset();
    FakeLocalStorage.patchGlobal();
});
