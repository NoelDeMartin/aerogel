import { z } from 'zod';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function solidContainerUrl() {
    return z.string().refine((value) => value.endsWith('/'), 'containerEndingSlashMissing');
}
