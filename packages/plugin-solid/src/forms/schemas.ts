import { z } from 'zod';

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export function solidContainerUrl() {
    return z.string().refine((value) => value.endsWith('/'), 'containerEndingSlashMissing');
}
