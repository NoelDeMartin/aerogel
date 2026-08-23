import { isInstanceOf } from '@noeldemartin/utils';
import z from 'zod';

import InvalidEnvError from '@aerogel/core/errors/InvalidEnvError';

const DefaultSchema = z.object({});

let parsedEnv: Record<string, unknown> | null = null;

export type EnvConfig = {
    value: Record<string, unknown>;
    schema: z.ZodObject;
};

export interface Env extends z.infer<typeof DefaultSchema> {}

export function defineEnv(value: Record<string, unknown>, schema: z.ZodObject): EnvConfig {
    return { value, schema };
}

export function setupEnv(config: EnvConfig): void {
    try {
        parsedEnv = DefaultSchema.extend(config.schema.shape).parse(config.value);
    } catch (error) {
        if (!isInstanceOf(error, z.ZodError)) {
            throw error;
        }

        throw new InvalidEnvError(error);
    }
}

export function env<T extends keyof Env>(key: T): Env[T] {
    if (!parsedEnv) {
        throw new Error(`Tried to read env '${key}' before initialization (use env option in bootstrap options).`);
    }

    return (parsedEnv as Env)[key];
}
