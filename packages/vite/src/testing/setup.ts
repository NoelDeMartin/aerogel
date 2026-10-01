import { vi } from 'vite-plus/test';

vi.mock('fs', async () => {
    const fs = (await vi.importActual('fs')) as Record<string, unknown>;

    return {
        ...fs,
        readFileSync(path: string): string {
            return `file-source[${path}]`;
        },
    };
});
