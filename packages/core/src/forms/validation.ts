import { arrayFrom } from '@noeldemartin/utils';

import type { FormFieldDefinition } from '@aerogel/core/forms/FormController';

const builtInRules: Record<string, FormFieldValidator> = {
    required: (value) => (value ? undefined : 'required'),
};

function isValidType(value: unknown, definition: FormFieldDefinition): boolean {
    if (value === undefined || value === null) {
        return true;
    }

    switch (definition.type) {
        case 'string':
            return typeof value === 'string';
        case 'enum':
            return !!definition.values?.includes(value);
        case 'number':
            return typeof value === 'number';
        case 'boolean':
            return typeof value === 'boolean';
        case 'date':
            return value instanceof Date;
        case 'object':
            return typeof value === 'object';
    }
}

export type FormFieldValidator<T = unknown> = (value: T) => string | string[] | undefined;

export const validators: Record<string, FormFieldValidator> = { ...builtInRules };

export function registerFormValidationRule<T>(rule: string, validator: FormFieldValidator<T>): void {
    validators[rule] = validator as FormFieldValidator;
}

export function defineFormValidationRules<T extends Record<string, FormFieldValidator>>(rules: T): T {
    return rules;
}

export function validateType(value: unknown, definition: FormFieldDefinition): string[] {
    if (isValidType(value, definition)) {
        return [];
    }

    return ['invalid_value'];
}

export function validate(value: unknown, rule: string): string[] {
    const errors = validators[rule]?.(value);

    return errors ? arrayFrom(errors) : [];
}
