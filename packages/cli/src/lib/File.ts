import {
    existsSync,
    lstatSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    rmdirSync,
    unlinkSync,
    writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';

import { facade } from '@noeldemartin/utils';

export class FileService {

    public contains(path: string, contents: string): boolean {
        return !!this.read(path)?.includes(contents);
    }

    public exists(path: string): boolean {
        return existsSync(path);
    }

    public delete(path: string): void {
        if (this.isDirectory(path)) {
            rmdirSync(path, { recursive: true });

            return;
        }

        unlinkSync(path);
    }

    public isSymlink(path: string): boolean {
        const stats = lstatSync(path);

        return stats.isSymbolicLink();
    }

    public read(path: string): string | null {
        if (!this.isFile(path)) {
            return null;
        }

        return readFileSync(path).toString();
    }

    public replace(path: string, search: string | RegExp, replacement: string): void {
        const contents = this.read(path);

        if (!contents) {
            return;
        }

        this.write(path, contents.replaceAll(search, replacement));
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

    public isDirectory(path: string): boolean {
        return this.exists(path) && lstatSync(path).isDirectory();
    }

    public isFile(path: string): boolean {
        return this.exists(path) && lstatSync(path).isFile();
    }

    public isEmptyDirectory(path: string): boolean {
        if (!this.isDirectory(path)) {
            return false;
        }

        return this.getFiles(path).length === 0;
    }

    public makeDirectory(path: string): void {
        mkdirSync(path, { recursive: true });
    }

    public write(path: string, contents: string): void {
        if (!existsSync(dirname(path))) {
            mkdirSync(dirname(path), { recursive: true });
        }

        writeFileSync(path, contents);
    }

}

export default facade(FileService);
