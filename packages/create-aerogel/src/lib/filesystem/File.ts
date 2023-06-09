import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'fs';
import { facade } from '@noeldemartin/utils';
import { dirname, resolve } from 'path';

export class FileService {

    public exists(path: string): boolean {
        return existsSync(path);
    }

    public getFiles(directoryPath: string): string[] {
        const children = readdirSync(directoryPath, { withFileTypes: true });
        const files: string[] = [];

        for (const child of children) {
            const path = resolve(directoryPath, child.name);

            if (child.isDirectory()) {
                files.push(...this.getFiles(path));
            } else {
                files.push(path);
            }
        }

        return files;
    }

    public write(path: string, contents: string): void {
        if (!existsSync(dirname(path))) {
            mkdirSync(dirname(path), { recursive: true });
        }

        writeFileSync(path, contents);
    }

}

export const File = facade(new FileService());
