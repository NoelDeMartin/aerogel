import { vi } from 'vitest';

vi.mock('fs', async () => {
    const fs = (await vi.importActual('fs')) as Object;

    return {
        ...fs,
        readFileSync(path: string): string {
            return `file-source[${path}]`;
        },
    };
});
