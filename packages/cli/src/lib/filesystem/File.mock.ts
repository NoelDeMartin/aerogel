import { expect } from 'vitest';
import { facade } from '@noeldemartin/utils';
import type { Assertion } from 'vitest';

import { FileService } from './File';

export class FileMockService extends FileService {

    private virtualFilesystem: Record<string, string> = {};

    public exists(path: string): boolean {
        return super.exists(path) || path in this.virtualFilesystem;
    }

    public write(path: string, contents: string): void {
        this.virtualFilesystem[path] = contents;
    }

    public expectCreated(path: string, expectContent?: (contents: string) => void): Assertion<string> {
        expect(path in this.virtualFilesystem, `expected '${path}' file to have been created`).toBe(true);

        const contents = this.virtualFilesystem[path] ?? '';

        expectContent?.(contents);

        return expect(contents);
    }

}

export default facade(new FileMockService());
