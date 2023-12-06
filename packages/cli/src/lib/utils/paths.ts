import { resolve } from 'path';
import { stringMatch } from '@noeldemartin/utils';

import File from '@/lib/File';
import Log from '@/lib/Log';

export function basePath(path: string = ''): string {
    if (File.contains(resolve(__dirname, '../../../package.json'), '"name": "aerogel"')) {
        return resolve(__dirname, '../', path);
    }

    const packageJson = File.read(resolve(__dirname, '../../../../package.json'));
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
    return resolve(__dirname, `../templates/${name}`);
}
