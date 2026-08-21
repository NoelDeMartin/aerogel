import { isInstanceOf, parseBoolean } from '@noeldemartin/utils';
import z from 'zod';

import InvalidEnvError from '@aerogel/core/errors/InvalidEnvError';

const DefaultSchema = z.object({
    CI: z.string().optional().transform(parseBoolean),
});

let schema: z.ZodObject = DefaultSchema;
let parsedEnv: z.infer<typeof schema> | null = null;

export interface Env extends z.infer<typeof DefaultSchema> {}

export function extendEnv(extendedSchema: z.ZodObject): void {
    schema = schema.extend(extendedSchema.shape);
    parsedEnv = null;
}

export function env<T extends keyof Env>(key: T): Env[T] {
    try {
        parsedEnv ??= schema.parse(import.meta.env);
    } catch (error) {
        if (!isInstanceOf(error, z.ZodError)) {
            throw error;
        }

        throw new InvalidEnvError(error);
    }

    return (parsedEnv as Env)[key];
}
