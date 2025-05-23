import { URL, fileURLToPath } from 'node:url';
import { stringMatch } from '@noeldemartin/utils';
import { resolve } from 'node:path';

import File from '@aerogel/cli/lib/File';
import Log from '@aerogel/cli/lib/Log';

export function basePath(path: string = ''): string {
    if (process.env.AEROGEL_BASE_PATH) {
        return resolve(process.env.AEROGEL_BASE_PATH, path);
    }

    if (
        File.contains(
            fileURLToPath(new URL(/* @vite-ignore */ '../../../package.json', import.meta.url)),
            '"packages/create-aerogel"',
        )
    ) {
        return resolve(fileURLToPath(new URL(/* @vite-ignore */ '../', import.meta.url)), path);
    }

    const packageJson = File.read(
        fileURLToPath(new URL(/* @vite-ignore */ '../../../../package.json', import.meta.url)),
    );
    const matches = stringMatch<2>(packageJson ?? '', /"@aerogel\/core": "file:(.*)\/aerogel-core-[\d.]*\.tgz"/);
    const cliPath = matches?.[1] ?? Log.fail<string>('Could not determine base path');

    return resolve(cliPath, path);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    return fileURLToPath(new URL(/* @vite-ignore */ `../templates/${name}`, import.meta.url));
}
