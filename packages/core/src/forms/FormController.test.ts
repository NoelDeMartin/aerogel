import { describe, expect, expectTypeOf, it } from 'vitest';

import { useForm } from '@aerogel/core/forms/composition';
import { numberInput, requiredStringInput } from '@aerogel/core/forms/utils';

import { FormFieldTypes } from './FormController';

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
                type: FormFieldTypes.String,
                rules: 'required',
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
                type: FormFieldTypes.String,
                rules: 'required',
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
                type: FormFieldTypes.String,
                rules: 'required',
            },
            untrimmed: {
                type: FormFieldTypes.String,
                rules: 'required',
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

});
