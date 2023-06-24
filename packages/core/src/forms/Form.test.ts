import { describe, expect, expectTypeOf, it } from 'vitest';

import { useForm } from './composition';
import { FormFieldTypes } from '@/main';
import { numberInput, requiredStringInput } from '@/forms/utils';

describe('Form', () => {

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

});
