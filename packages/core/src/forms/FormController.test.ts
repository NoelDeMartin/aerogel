import { describe, expect, expectTypeOf, it } from 'vitest';
import { tt } from '@noeldemartin/testing';
import { z } from 'zod';
import type { Equals } from '@noeldemartin/utils';
import type { Expect } from '@noeldemartin/testing';

import { useForm } from '@aerogel/core/utils/composition/forms';

describe('FormController', () => {

    it('defines magic fields', () => {
        const form = useForm({
            name: z.string(),
            age: z.number().optional(),
        });

        expectTypeOf(form.name).toEqualTypeOf<string>();
        expectTypeOf(form.age).toEqualTypeOf<number | null>();
    });

    it('validates required fields', () => {
        // Arrange
        const form = useForm({
            name: z.string(),
            nickname: z.string().optional(),
            alias: z.string().nullable(),
        });

        // Act
        form.submit();

        // Assert
        expect(form.valid).toBe(false);
        expect(form.submitted).toBe(true);
        expect(form.errors).toEqual({ name: ['required'], nickname: null, alias: null });
    });

    it('validates schema rules', () => {
        // Arrange
        const form = useForm({
            name: z.string().min(3),
            url: z.string().refine((value) => value.endsWith('/'), 'missing_slash'),
            accept: z.literal(true).default(true),
        });

        form.name = 'Al';
        form.url = 'https://example.com';
        form.accept = false;

        // Act
        form.submit();

        // Assert
        expect(form.valid).toBe(false);
        expect(form.errors).toEqual({
            name: ['too_small'],
            url: ['missing_slash'],
            accept: ['required'],
        });
    });

    it('validates checkboxes', () => {
        // Arrange
        const form = useForm({
            accept: z.literal(true),
            subscribe: z.boolean().default(false),
            name: z.string(),
        });

        form.accept = false;
        form.name = false as unknown as string;

        // Act
        form.submit();

        // Assert
        expect(form.errors).toEqual({
            accept: ['required'],
            subscribe: null,
            name: ['invalid_type'],
        });
    });

    it('revalidates after submitting', () => {
        // Arrange
        const form = useForm({ name: z.string() });

        form.submit();

        // Act
        form.name = 'Foo bar';

        // Assert
        expect(form.valid).toBe(true);
        expect(form.errors.name).toBeNull();
    });

    it('revalidates empty strings as missing', () => {
        // Arrange
        const form = useForm({
            name: z.string(),
            website: z.url().optional(),
        });

        form.name = 'Foo bar';
        form.website = 'https://example.com';
        form.submit();

        // Act
        form.name = '';
        form.website = '  ';

        // Assert
        expect(form.valid).toBe(false);
        expect(form.errors).toEqual({ name: ['required'], website: null });
    });

    it('initializes defaults', () => {
        const form = useForm({
            name: z.string().prefault('Foo'),
            subscribe: z.boolean(),
            accept: z.literal(true),
        });

        expect(form.name).toEqual('Foo');
        expect(form.subscribe).toBe(false);
        expect(form.accept).toBeNull();
    });

    it('resets form', () => {
        // Arrange
        const form = useForm({
            name: z.string(),
            accept: z.boolean().default(true),
        });

        form.name = 'Foo bar';
        form.accept = false;
        form.submit();

        // Act
        form.reset();

        // Assert
        expect(form.valid).toBe(true);
        expect(form.submitted).toBe(false);
        expect(form.name).toBeNull();
        expect(form.accept).toBe(true);
    });

    it('trims values', () => {
        // Arrange
        const form = useForm({
            trimmed: z.string(),
            padded: z.string(),
        });

        // Act
        form.trimmed = '   ';
        form.padded = '  foo  ';

        form.submit();

        // Assert
        expect(form.valid).toBe(false);
        expect(form.submitted).toBe(true);
        expect(form.trimmed).toBeNull();
        expect(form.padded).toEqual('foo');
        expect(form.errors).toEqual({ trimmed: ['required'], padded: null });
    });

    it('introspects fields', () => {
        const form = useForm({
            name: z.string(),
            email: z.email().optional(),
            age: z.number().default(42),
            accept: z.literal(true),
            subscribe: z.boolean().default(false),
        });

        expect(form.isFieldRequired('name')).toBe(true);
        expect(form.isFieldRequired('email')).toBe(false);
        expect(form.isFieldRequired('age')).toBe(true);
        expect(form.isFieldRequired('accept')).toBe(true);
        expect(form.isFieldRequired('subscribe')).toBe(false);
        expect(form.getFieldNativeInputType('name')).toEqual('text');
        expect(form.getFieldNativeInputType('email')).toEqual('email');
        expect(form.getFieldNativeInputType('age')).toEqual('number');
        expect(form.getFieldNativeInputType('accept')).toEqual('checkbox');
        expect(form.getFieldNativeInputType('subscribe')).toEqual('checkbox');
        expect(form.age).toEqual(42);
    });

    it('infers field types', () => {
        const form = useForm({
            one: z.string().optional(),
            two: z.string(),
            three: z.object({ foo: z.string() }).nullable(),
            four: z.object({ foo: z.string(), bar: z.number().optional() }),
            five: z.enum(['foo', 'bar']).optional(),
            six: z.boolean().default(true),
            seven: z.date(),
            eight: z.literal(true),
            nine: z.literal(true).default(true),
            ten: z.literal(true).optional(),
        });

        tt<
            | Expect<Equals<typeof form.one, string | null>>
            | Expect<Equals<typeof form.two, string>>
            | Expect<Equals<typeof form.three, { foo: string } | null>>
            | Expect<Equals<typeof form.four, { foo: string; bar?: number | undefined }>>
            | Expect<Equals<typeof form.five, 'foo' | 'bar' | null>>
            | Expect<Equals<typeof form.six, boolean>>
            | Expect<Equals<typeof form.seven, Date>>
            | Expect<Equals<typeof form.eight, boolean>>
            | Expect<Equals<typeof form.nine, boolean>>
            | Expect<Equals<typeof form.ten, boolean | null>>
        >();
    });

});
