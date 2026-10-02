import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import File from '@aerogel/cli/lib/File';
import Log from '@aerogel/cli/lib/Log';
import { memo, stringMatch } from '@noeldemartin/utils';

function findCliDirectory(): string {
    let directory = dirname(fileURLToPath(import.meta.url));

    while (!File.contains(resolve(directory, 'package.json'), '"name": "@aerogel/cli"')) {
        const parentDirectory = dirname(directory);

        if (parentDirectory === directory) {
            return Log.fail('Could not find the @aerogel/cli package');
        }

        directory = parentDirectory;
    }

    return directory;
}

export function cliPath(path: string = ''): string {
    return resolve(memo('cli-directory', findCliDirectory), path);
}

export function basePath(path: string = ''): string {
    if (process.env.AEROGEL_BASE_PATH) {
        return resolve(process.env.AEROGEL_BASE_PATH, path);
    }

    if (File.contains(cliPath('../../package.json'), '"name": "aerogel"')) {
        return cliPath(path);
    }

    const packageJson = File.read('package.json');
    const matches = stringMatch<2>(packageJson ?? '', /"@aerogel\/core": "file:(.*?)(?:\/aerogel-core-[\d.]*\.tgz)?"/);
    const corePath = matches?.[1] ?? Log.fail<string>('Could not determine base path');

    return resolve(corePath, path);
}

// oxlint-disable-next-line typescript/no-explicit-any
export function packNotFound(packageName: string): any {
    return Log.fail(`Could not find ${packageName} pack file, did you run 'npm pack'?`);
}

export function packagePackPath(packageName: string): string | null {
    return File.getFiles(packagePath(packageName)).find((file) => file.endsWith('.tgz')) ?? null;
}

export function packagePath(packageName: string): string {
    return basePath(`../${packageName}`);
}

export function templatePath(name: string): string {
    return cliPath(`templates/${name}`);
}
