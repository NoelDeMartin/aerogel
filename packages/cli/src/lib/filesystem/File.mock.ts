import { expect } from 'vitest';
import { facade } from '@noeldemartin/utils';

import { FileService } from './File';

export class FileMockService extends FileService {

    private virtualFilesystem: Record<string, string> = {};

    public exists(path: string): boolean {
        return super.exists(path) || path in this.virtualFilesystem;
    }

    public write(path: string, contents: string): void {
        this.virtualFilesystem[path] = contents;
    }

    public expectCreated(path: string, expectContent?: (content: string) => void): void {
        expect(path in this.virtualFilesystem, `expected '${path}' file to have been created`).toBe(true);

        expectContent?.(this.virtualFilesystem[path] ?? '');
    }

}

export default facade(new FileMockService());
