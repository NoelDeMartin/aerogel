import { isNullable } from '@noeldemartin/utils';
import type { z } from 'zod';

function isDefaultSchema(schema: z.ZodType): schema is z.ZodDefault | z.ZodPrefault {
    return schema.def.type === 'default' || schema.def.type === 'prefault';
}

function getInnerSchema(schema: z.ZodType): z.ZodType | null {
    const def = schema.def as z.ZodType['def'] & { innerType?: z.ZodType; in?: z.ZodType };

    switch (def.type) {
        case 'optional':
        case 'nullable':
        case 'default':
        case 'prefault':
        case 'nonoptional':
        case 'readonly':
        case 'catch':
            return def.innerType ?? null;
        case 'pipe':
            return def.in ?? null;
        default:
            return null;
    }
}

function withoutDefault(schema: z.ZodType): z.ZodType {
    let current: z.ZodType | null = schema;

    while (current && ['default', 'prefault'].includes(current.def.type)) {
        current = getInnerSchema(current);
    }

    return current ?? schema;
}

export function getFinalSchema(schema: z.ZodType): z.ZodType {
    let current = schema;
    let inner = getInnerSchema(current);

    while (inner) {
        current = inner;
        inner = getInnerSchema(current);
    }

    return current;
}

export function isBooleanSchema(schema: z.ZodType): boolean {
    const finalSchema = getFinalSchema(schema);

    switch (finalSchema.def.type) {
        case 'boolean':
            return true;
        case 'literal':
            return (finalSchema as z.ZodLiteral).def.values.every((value) => typeof value === 'boolean');
        default:
            return false;
    }
}

export function isArraySchema(schema: z.ZodType): boolean {
    return getFinalSchema(schema).def.type === 'array';
}

export function getDefaultValue(schema: z.ZodType): unknown {
    let current: z.ZodType | null = schema;

    while (current) {
        if (isDefaultSchema(current)) {
            return current.def.defaultValue;
        }

        current = getInnerSchema(current);
    }

    return getFinalSchema(schema).def.type === 'boolean' ? false : null;
}

export function isSchemaRequired(schema: z.ZodType): boolean {
    const baseSchema = withoutDefault(schema);

    if (isBooleanSchema(schema)) {
        return !baseSchema.safeParse(false).success;
    }

    if (getFinalSchema(baseSchema).def.type === 'tuple' && isDefaultSchema(schema)) {
        return !baseSchema.safeParse(getDefaultValue(schema)).success;
    }

    return !baseSchema.safeParse(null).success && !baseSchema.safeParse(undefined).success;
}

export function validateSchema(schema: z.ZodType, value: unknown): string[] {
    const normalizedValue = typeof value === 'string' && value.trim() === '' ? null : value;

    if (isNullable(normalizedValue)) {
        return isSchemaRequired(schema) ? ['required'] : [];
    }

    const result = schema.safeParse(normalizedValue, {
        error: (issue) => (issue.code === 'invalid_type' && issue.input == null ? 'required' : issue.code),
    });

    if (result.success) {
        return [];
    }

    if (value === false && isBooleanSchema(schema)) {
        return ['required'];
    }

    return Array.from(new Set(result.error.issues.map((issue) => issue.message)));
}
