import { readFileSync } from 'fs';
import { render } from 'mustache';

import { File } from '@/lib/filesystem/File';

export class Template {

    constructor(public path: string) {}

    public instantiate(destination: string, replacements: Record<string, string> = {}): void {
        destination = `${destination}/`.replace(/\/\//, '/');

        for (const file of File.getFiles(this.path)) {
            const relativePath = file.substring(this.path.length + 1);
            const fileContents = readFileSync(file).toString();

            File.write(destination + relativePath, render(fileContents, { config: replacements }));
        }
    }

}
