import { resolve } from 'path';
import { setTestingNamespace } from '@noeldemartin/utils';
import { vi } from 'vitest';

import File from '@/lib/File';
import FileMock from '@/lib/File.mock';
import Shell from '@/lib/Shell';
import ShellMock from '@/lib/Shell.mock';

setTestingNamespace(vi);

File.setMockInstance(FileMock);
Shell.setMockInstance(ShellMock);

// TODO find out why these need to be mocked

vi.mock('@/lib/utils', async () => {
    const utils = (await vi.importActual('@/lib/utils')) as object;

    return {
        ...utils,
        basePath(path: string) {
            return resolve(__dirname, '../../', path);
        },
    };
});

vi.mock('mustache', async () => {
    const mustache = (await vi.importActual('mustache')) as { default: unknown };

    return mustache.default;
});
