import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { facade } from '@noeldemartin/utils';
import { dirname, resolve } from 'path';

export class FileService {

    public exists(path: string): boolean {
        return existsSync(path);
    }

    public read(path: string): string | null {
        if (!this.isFile(path)) {
            return null;
        }

        return readFileSync(path).toString();
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

export default facade(new FileService());
