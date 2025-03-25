import Mustache from 'mustache';
import { readFileSync } from 'node:fs';
import { toString } from '@noeldemartin/utils';

import File from '@aerogel/cli/lib/File';

export default class Template {

    public static instantiate(
        path: string,
        destination: string = './',
        replacements: Record<string, unknown> = {},
    ): string[] {
        const template = new Template(path);

        return template.instantiate(destination, replacements);
    }

    constructor(public path: string) {}

    public instantiate(destination: string, replacements: Record<string, unknown> = {}): string[] {
        const filenameReplacements = this.getFilenameReplacements(replacements);
        const files: string[] = [];
        destination = `${destination}/`.replace(/\/\//, '/');

        for (const file of File.getFiles(this.path)) {
            const relativePath = Object.entries(filenameReplacements).reduce(
                (path, [match, replacement]) => path.replaceAll(match, replacement),
                file.substring(this.path.length + 1),
            );
            const fileContents = readFileSync(file).toString();
            const filePath =
                destination + (relativePath.endsWith('.template') ? relativePath.slice(0, -9) : relativePath);

            File.write(filePath, Mustache.render(fileContents, replacements, undefined, ['<%', '%>']));
            files.push(filePath);
        }

        return files;
    }

    protected getFilenameReplacements(
        replacements: Record<string, unknown>,
        prefix: string = '',
    ): Record<string, string> {
        return Object.entries(replacements).reduce(
            (filenameReplacements, [key, value]) => {
                if (typeof value === 'object') {
                    Object.assign(
                        filenameReplacements,
                        this.getFilenameReplacements(value as Record<string, unknown>, `${key}.`),
                    );
                } else {
                    filenameReplacements[`[${prefix}${key}]`] = toString(value);
                }

                return filenameReplacements;
            },
            {} as Record<string, string>,
        );
    }

}
