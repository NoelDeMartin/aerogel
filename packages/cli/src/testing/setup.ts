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

vi.mock('@/lib/utils/app', async () => {
    const original = (await vi.importActual('@/lib/utils/app')) as object;

    return {
        ...original,
        isLocalApp: () => false,
        isLinkedLocalApp: () => false,
    };
});

vi.mock('@/lib/utils/edit', async () => {
    const original = (await vi.importActual('@/lib/utils/edit')) as object;

    return {
        ...original,
        editFiles: () => false,
    };
});

// TODO find out why these need to be mocked
vi.mock('@/lib/utils/paths', async () => {
    const original = (await vi.importActual('@/lib/utils/paths')) as object;

    function basePath(path: string = '') {
        return resolve(__dirname, '../../', path);
    }

    function packagePath(packageName: string) {
        return basePath(`../${packageName}`);
    }

    function templatePath(name: string = '') {
        return resolve(__dirname, `../../templates/${name}`);
    }

    return {
        ...original,
        basePath,
        packagePath,
        templatePath,
    };
});

vi.mock('mustache', async () => {
    const mustache = (await vi.importActual('mustache')) as { default: unknown };

    return mustache.default;
});
