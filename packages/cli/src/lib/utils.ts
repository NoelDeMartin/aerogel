import { resolve } from 'path';

export function basePath(path: string): string {
    return resolve(__dirname, '../', path);
}
