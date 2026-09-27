import { z } from 'zod';

export type NumberRange = z.infer<ReturnType<typeof numberRange>>;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function numberRange() {
    return z.tuple([z.number().nullable(), z.number().nullable()]).default([null, null]);
}
