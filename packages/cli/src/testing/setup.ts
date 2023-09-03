import { beforeEach, vi } from 'vitest';
import { resolve } from 'path';
import { setTestingNamespace } from '@noeldemartin/utils';

import File from '@/lib/File';
import FileMock from '@/lib/File.mock';
import Log from '@/lib/Log';
import LogMock from '@/lib/Log.mock';
import Shell from '@/lib/Shell';
import ShellMock from '@/lib/Shell.mock';

setTestingNamespace(vi);

File.setMockInstance(FileMock);
Log.setMockInstance(LogMock);
Shell.setMockInstance(ShellMock);

beforeEach(() => {
    FileMock.reset();
    LogMock.reset();

    File.mock();
    Log.mock();
    Shell.mock();
});

// TODO find out why these need to be mocked

vi.mock('@/lib/utils', async () => {
    const utils = (await vi.importActual('@/lib/utils')) as object;

    return {
        ...utils,
        basePath(path: string = '') {
            return resolve(__dirname, '../../', path);
        },
    };
});

vi.mock('mustache', async () => {
    const mustache = (await vi.importActual('mustache')) as { default: unknown };

    return mustache.default;
});
