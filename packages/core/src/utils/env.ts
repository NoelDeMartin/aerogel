import { isDevelopment, isInstanceOf, parseBoolean } from '@noeldemartin/utils';
import z from 'zod';

import InvalidEnvError from '@aerogel/core/errors/InvalidEnvError';

const DefaultSchema = z.object({
    CI: z.string().optional().transform(parseBoolean),
});

let ready = false;
let schema: z.ZodObject = DefaultSchema;
let parsedEnv: z.infer<typeof schema> | null = null;

export interface Env extends z.infer<typeof DefaultSchema> {}

export function setupEnv(extendedSchema?: z.ZodObject): void {
    if (extendedSchema) {
        schema = schema.extend(extendedSchema.shape);
    }

    ready = true;
    parsedEnv = null;

    env('CI');
}

export function env<T extends keyof Env>(key: T): Env[T] {
    if (!ready) {
        if (isDevelopment()) {
            throw new Error(`Tried to read env '${key}' before bootstrapping application.`);
        }

        // eslint-disable-next-line no-console
        console.warn(`Reading env '${key}' before bootstrapping application can lead to unexpected behavior.`);
    }

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
