import { resolve } from 'path';
import { stringMatch } from '@noeldemartin/utils';

import File from '@/lib/File';
import Log from '@/lib/Log';

export interface FormatCodeBlockOptions {
    indent?: number;
}

export function basePath(path: string = ''): string {
    if (File.contains(resolve(__dirname, '../../../package.json'), '"name": "aerogel"')) {
        return resolve(__dirname, '../', path);
    }

    const packageJson = File.read(resolve(__dirname, '../../../../package.json'));
    const matches = stringMatch<2>(packageJson ?? '', /"@aerogel\/cli": "file:(.*)\/aerogel-cli-[\d.]*\.tgz"/);
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

export function isLocalApp(): boolean {
    return File.contains('package.json', 'file');
}

export function isLinkedLocalApp(): boolean {
    return File.isSymlink('node_modules/@aerogel/core');
}

export function formatCodeBlock(code: string, options: FormatCodeBlockOptions = {}): string {
    const lines = code.split('\n');
    const indent = options.indent ?? 0;
    let originalIndent = 0;
    let formatted = '';

    for (const line of lines) {
        const trimmedLine = line.trim();
        const isEmptyLine = trimmedLine.length === 0;

        if (formatted.length === 0) {
            if (isEmptyLine) {
                continue;
            }

            originalIndent = line.indexOf(trimmedLine[0] ?? '');
            formatted += `${' '.repeat(indent)}${trimmedLine}\n`;

            continue;
        }

        if (isEmptyLine) {
            formatted += '\n';

            continue;
        }

        const lineIndent = line.indexOf(trimmedLine[0] ?? '');

        formatted += `${' '.repeat(indent + lineIndent - originalIndent)}${trimmedLine}\n`;
    }

    return formatted.trimEnd();
}
