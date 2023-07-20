import { readFileSync } from 'fs';
import { render } from 'mustache';
import { toString } from '@noeldemartin/utils';

import File from '@/lib/File';

export default class Template {

    public static instantiate(path: string, destination: string, replacements: Record<string, unknown>): void {
        const template = new Template(path);

        template.instantiate(destination, replacements);
    }

    constructor(public path: string) {}

    public instantiate(destination: string, replacements: Record<string, unknown> = {}): void {
        const filenameReplacements = this.getFilenameReplacements(replacements);
        destination = `${destination}/`.replace(/\/\//, '/');

        for (const file of File.getFiles(this.path)) {
            const relativePath = Object.entries(filenameReplacements).reduce(
                (path, [match, replacement]) => path.replaceAll(match, replacement),
                file.substring(this.path.length + 1),
            );
            const fileContents = readFileSync(file).toString();

            File.write(destination + relativePath, render(fileContents, replacements, undefined, ['<%', '%>']));
        }
    }

    protected getFilenameReplacements(
        replacements: Record<string, unknown>,
        prefix: string = '',
    ): Record<string, string> {
        return Object.entries(replacements).reduce((filenameReplacements, [key, value]) => {
            if (typeof value === 'object') {
                Object.assign(
                    filenameReplacements,
                    this.getFilenameReplacements(value as Record<string, unknown>, `${key}.`),
                );
            } else {
                filenameReplacements[`[${prefix}${key}]`] = toString(value);
            }

            return filenameReplacements;
        }, {} as Record<string, string>);
    }

}
