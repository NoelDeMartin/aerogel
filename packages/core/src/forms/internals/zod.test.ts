import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
    getDefaultValue,
    getFinalSchema,
    isArraySchema,
    isBooleanSchema,
    isSchemaRequired,
    validateSchema,
} from './zod';

describe('Zod helpers', () => {

    it('gets the final schema', () => {
        const schema = z.string();

        expect(getFinalSchema(schema)).toBe(schema);
        expect(getFinalSchema(z.string().optional()).def.type).toBe('string');
        expect(getFinalSchema(z.string().nullable()).def.type).toBe('string');
        expect(getFinalSchema(z.string().default('x')).def.type).toBe('string');
        expect(getFinalSchema(z.string().nullable().optional().default('x')).def.type).toBe('string');
    });

    it('gets the default value', () => {
        expect(getDefaultValue(z.string())).toBeNull();
        expect(getDefaultValue(z.boolean())).toBe(false);
        expect(getDefaultValue(z.string().default('hello'))).toBe('hello');
        expect(getDefaultValue(z.number().default(42))).toBe(42);
        expect(getDefaultValue(z.string().default('inner').optional())).toBe('inner');
        expect(getDefaultValue(z.tuple([z.number().nullable(), z.number().nullable()]).default([null, null]))).toEqual([
            null,
            null,
        ]);
    });

    it('checks if schema is boolean', () => {
        expect(isBooleanSchema(z.boolean())).toBe(true);
        expect(isBooleanSchema(z.literal(true))).toBe(true);
        expect(isBooleanSchema(z.literal(false))).toBe(true);
        expect(isBooleanSchema(z.boolean().default(false))).toBe(true);
        expect(isBooleanSchema(z.string())).toBe(false);
        expect(isBooleanSchema(z.literal(1))).toBe(false);
    });

    it('checks if schema is array', () => {
        expect(isArraySchema(z.array(z.string()))).toBe(true);
        expect(isArraySchema(z.array(z.string()).optional())).toBe(true);
        expect(isArraySchema(z.tuple([z.string()]))).toBe(false);
        expect(isArraySchema(z.string())).toBe(false);
    });

    it('checks if schema is required', () => {
        expect(isSchemaRequired(z.string())).toBe(true);
        expect(isSchemaRequired(z.string().optional())).toBe(false);
        expect(isSchemaRequired(z.string().nullable())).toBe(false);

        // A default does not make the field accept null — it only fills the initial value
        expect(isSchemaRequired(z.string().default('hello'))).toBe(true);
        expect(isSchemaRequired(z.literal(true))).toBe(true);
        expect(isSchemaRequired(z.boolean().default(false))).toBe(false);

        // Bare tuples are required: null is never a valid tuple value, even with nullable elements
        expect(isSchemaRequired(z.tuple([z.number(), z.number()]))).toBe(true);
        expect(isSchemaRequired(z.tuple([z.number().nullable(), z.number().nullable()]))).toBe(true);
        expect(isSchemaRequired(z.tuple([z.number().nullable(), z.number().nullable()]).nullable())).toBe(false);

        // Tuples with a default are not required if the default itself satisfies the base schema
        const nullableTupleWithDefault = z.tuple([z.number().nullable(), z.number().nullable()]).default([null, null]);

        expect(isSchemaRequired(z.tuple([z.number(), z.number()]).default([0, 100]))).toBe(false);
        expect(isSchemaRequired(nullableTupleWithDefault)).toBe(false);
    });

    it('validates schema values', () => {
        expect(validateSchema(z.string(), null)).toEqual(['required']);
        expect(validateSchema(z.string().optional(), null)).toEqual([]);
        expect(validateSchema(z.string().nullable(), null)).toEqual([]);

        // Empty string is treated as null
        expect(validateSchema(z.string(), '')).toEqual(['required']);
        expect(validateSchema(z.string().optional(), '')).toEqual([]);

        expect(validateSchema(z.string().min(3), 'ab')).toEqual(['too_small']);
        expect(validateSchema(z.string().min(3).max(2), 'ab')).toEqual(['too_small']); // errors deduplicated
        expect(validateSchema(z.literal(true), false)).toEqual(['required']);

        const trailingSlash = z.string().refine((v) => v.endsWith('/'), 'missing_slash');

        expect(validateSchema(trailingSlash, 'https://example.com')).toEqual(['missing_slash']);

        // Tuple values
        const rangeSchema = z.tuple([z.number().nullable(), z.number().nullable()]).default([null, null]);

        expect(validateSchema(rangeSchema, [20, null])).toEqual([]);
        expect(validateSchema(rangeSchema, [null, null])).toEqual([]);

        // null is not required when the tuple default satisfies the base schema
        expect(validateSchema(z.tuple([z.number(), z.number()]).default([0, 100]), null)).toEqual([]);

        // null inside a non-nullable element is a schema error
        expect(validateSchema(z.tuple([z.number(), z.number()]), [null, 5])).not.toEqual([]);

        // refine errors surface for tuples too
        const rangeRefine = rangeSchema.refine(([s, e]) => !s || !e || s <= e, 'invalid_range');

        expect(validateSchema(rangeRefine, [80, 20])).toEqual(['invalid_range']);
        expect(validateSchema(rangeRefine, [20, 80])).toEqual([]);
    });

});
