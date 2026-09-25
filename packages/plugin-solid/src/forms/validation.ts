import { z } from 'zod';

export function solidContainerUrl(): z.ZodString {
    return z.string().refine((value) => value.endsWith('/'), 'containerEndingSlashMissing');
}
