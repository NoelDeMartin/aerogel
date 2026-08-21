import { parseBoolean } from '@noeldemartin/utils';
import z from 'zod';

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
    parsedEnv ??= schema.parse(process.env);

    return (parsedEnv as Env)[key];
}
