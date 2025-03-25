import { FakeLocalStorage } from '@noeldemartin/testing';
import { beforeEach, vi } from 'vitest';

vi.mock('dompurify', async () => {
    return { default: { sanitize: (html: string) => html } };
});

beforeEach(() => {
    FakeLocalStorage.reset();
    FakeLocalStorage.patchGlobal();
});
