import { expect } from 'vitest';
import { facade } from '@noeldemartin/utils';
import type { Assertion } from 'vitest';

import { FileService } from './File';

export class FileMockService extends FileService {

    private virtualFilesystem: Record<string, string | { directory: true }> = {};

    public override exists(path: string): boolean {
        return super.exists(path) || path in this.virtualFilesystem;
    }

    public override isDirectory(path: string): boolean {
        return (
            super.isDirectory(path) ||
            (path in this.virtualFilesystem && typeof this.virtualFilesystem[path] === 'object')
        );
    }

    public override isFile(path: string): boolean {
        return (
            super.isFile(path) || (path in this.virtualFilesystem && typeof this.virtualFilesystem[path] === 'string')
        );
    }

    public override makeDirectory(path: string): void {
        this.virtualFilesystem[path] = { directory: true };
    }

    public override read(path: string): string | null {
        if (path in this.virtualFilesystem && typeof this.virtualFilesystem[path] === 'string') {
            return this.virtualFilesystem[path] as string;
        }

        return super.read(path);
    }

    public override write(path: string, contents: string): void {
        this.virtualFilesystem[path] = contents;
    }

    public expectCreated(path: string, expectContent?: (contents: string) => void): Assertion<string> {
        expect(typeof this.virtualFilesystem[path] === 'string', `expected '${path}' file to have been created`).toBe(
            true,
        );

        const contents = (this.virtualFilesystem[path] as string) ?? '';

        expectContent?.(contents);

        return expect(contents);
    }

    public stub(path: string, contents: string = ''): void {
        this.virtualFilesystem[path] = contents;
    }

}

export default facade(FileMockService);
