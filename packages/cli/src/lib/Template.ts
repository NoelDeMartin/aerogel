import { readFileSync } from 'fs';
import { render } from 'mustache';

import File from '@/lib/File';

export default class Template {

    constructor(public path: string) {}

    public instantiate(destination: string, replacements: Record<string, unknown> = {}): void {
        destination = `${destination}/`.replace(/\/\//, '/');

        for (const file of File.getFiles(this.path)) {
            const relativePath = file.substring(this.path.length + 1);
            const fileContents = readFileSync(file).toString();

            File.write(destination + relativePath, render(fileContents, replacements, undefined, ['<%', '%>']));
        }
    }

}
