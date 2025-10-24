import { describe, expect, expectTypeOf, it } from 'vitest';
import { tt } from '@noeldemartin/testing';
import type { Equals } from '@noeldemartin/utils';
import type { Expect } from '@noeldemartin/testing';

import {
    enumInput,
    numberInput,
    objectInput,
    requiredObjectInput,
    requiredStringInput,
    stringInput,
} from '@aerogel/core/forms/utils';
import { useForm } from '@aerogel/core/utils/composition/forms';

describe('FormController', () => {

    it('defines magic fields', () => {
        const form = useForm({
            name: requiredStringInput(),
            age: numberInput(),
        });

        expectTypeOf(form.name).toEqualTypeOf<string>();
        expectTypeOf(form.age).toEqualTypeOf<number | null>();
    });

    it('validates required fields', () => {
        // Arrange
        const form = useForm({
            name: {
                type: 'string',
                rules: ['required'],
            },
        });

        // Act
        form.submit();

        // Assert
        expect(form.valid).toBe(false);
        expect(form.submitted).toBe(true);
        expect(form.errors.name).toEqual(['required']);
    });

    it('resets form', () => {
        // Arrange
        const form = useForm({
            name: {
                type: 'string',
                rules: ['required'],
            },
        });

        form.name = 'Foo bar';
        form.submit();

        // Act
        form.reset();

        // Assert
        expect(form.valid).toBe(true);
        expect(form.submitted).toBe(false);
        expect(form.name).toBeNull();
    });

    it('trims values', () => {
        // Arrange
        const form = useForm({
            trimmed: {
                type: 'string',
                rules: ['required'],
            },
            untrimmed: {
                type: 'string',
                rules: ['required'],
                trim: false,
            },
        });

        // Act
        form.trimmed = '   ';
        form.untrimmed = '   ';

        form.submit();

        // Assert
        expect(form.valid).toBe(false);
        expect(form.submitted).toBe(true);
        expect(form.trimmed).toEqual('');
        expect(form.untrimmed).toEqual('   ');
        expect(form.errors).toEqual({ trimmed: ['required'], untrimmed: null });
    });

    it('infers field types', () => {
        const form = useForm({
            one: stringInput(),
            two: requiredStringInput(),
            three: objectInput(),
            four: requiredObjectInput<{ foo: string; bar?: number }>(),
            five: enumInput(['foo', 'bar']),
        });

        tt<
            | Expect<Equals<typeof form.one, string | null>>
            | Expect<Equals<typeof form.two, string>>
            | Expect<Equals<typeof form.three, object | null>>
            | Expect<Equals<typeof form.four, { foo: string; bar?: number }>>
            | Expect<Equals<typeof form.five, 'foo' | 'bar' | null>>
        >();
    });

});
