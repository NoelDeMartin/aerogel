import { beforeAll, beforeEach, vi } from 'vitest';
import { resolve } from 'node:path';
import { setupFacadeMocks } from '@noeldemartin/testing';

import ShellMock from '@aerogel/cli/lib/Shell.mock';
import File from '@aerogel/cli/lib/File';
import FileMock from '@aerogel/cli/lib/File.mock';
import Log from '@aerogel/cli/lib/Log';
import LogMock from '@aerogel/cli/lib/Log.mock';
import Shell from '@aerogel/cli/lib/Shell';

beforeAll(() => {
    File.setMockFacade(FileMock);
    Log.setMockFacade(LogMock);
    Shell.setMockFacade(ShellMock);
});

beforeEach(() => {
    File.mock();
    Log.mock();
    Shell.mock();
});

vi.mock('@noeldemartin/utils', async () => {
    const original = (await vi.importActual('@noeldemartin/utils')) as object;

    setupFacadeMocks();

    return original;
});

vi.mock('@aerogel/cli/lib/utils/app', async () => {
    const original = (await vi.importActual('@aerogel/cli/lib/utils/app')) as object;

    return {
        ...original,
        isLocalApp: () => false,
        isLinkedLocalApp: () => false,
    };
});

vi.mock('@aerogel/cli/lib/utils/edit', async () => {
    const original = (await vi.importActual('@aerogel/cli/lib/utils/edit')) as object;

    return {
        ...original,
        editFiles: () => false,
    };
});

vi.mock('simple-git', () => ({
    simpleGit: () => ({
        clone: () => Promise.resolve(),
    }),
}));

// TODO find out why these need to be mocked
vi.mock('@aerogel/cli/lib/utils/paths', async () => {
    const original = (await vi.importActual('@aerogel/cli/lib/utils/paths')) as object;

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
