import type { FormFieldDefinition } from './FormController';

export function booleanInput(
    defaultValue?: boolean,
    options: { rules?: string[] } = {},
): FormFieldDefinition<'boolean'> {
    return {
        default: defaultValue,
        type: 'boolean',
        rules: options.rules,
    };
}

export function dateInput(defaultValue?: Date, options: { rules?: string[] } = {}): FormFieldDefinition<'date'> {
    return {
        default: defaultValue,
        type: 'date',
        rules: options.rules,
    };
}

export function enumInput<const T extends string>(
    values: readonly T[],
    defaultValue?: T,
    options: { rules?: string[] } = {},
): FormFieldDefinition<'enum', string, T> {
    return {
        default: defaultValue,
        type: 'enum',
        rules: options.rules,
        values,
    };
}

export function requiredBooleanInput(
    defaultValue?: boolean,
    options: { rules?: string[] } = {},
): FormFieldDefinition<'boolean', 'required'> {
    return {
        default: defaultValue,
        type: 'boolean',
        rules: ['required', ...((options.rules as 'required'[]) ?? [])],
    };
}

export function requiredDateInput(
    defaultValue?: Date,
    options: { rules?: string[] } = {},
): FormFieldDefinition<'date', 'required'> {
    return {
        default: defaultValue,
        type: 'date',
        rules: ['required', ...((options.rules as 'required'[]) ?? [])],
    };
}

export function requiredEnumInput<const T extends string>(
    values: readonly T[],
    defaultValue?: T,
    options: { rules?: string[] } = {},
): FormFieldDefinition<'enum', 'required', T> {
    return {
        default: defaultValue,
        type: 'enum',
        rules: ['required', ...((options.rules as 'required'[]) ?? [])],
        values,
    };
}

export function requiredNumberInput(
    defaultValue?: number,
    options: { rules?: string[] } = {},
): FormFieldDefinition<'number', 'required'> {
    return {
        default: defaultValue,
        type: 'number',
        rules: ['required', ...((options.rules as 'required'[]) ?? [])],
    };
}

export function requiredObjectInput<T extends object>(
    defaultValue?: T,
    options: { rules?: string[] } = {},
): FormFieldDefinition<'object', 'required', T> {
    return {
        default: defaultValue,
        type: 'object',
        rules: ['required', ...((options.rules as 'required'[]) ?? [])],
    };
}

export function requiredStringInput(
    defaultValue?: string,
    options: { rules?: string[] } = {},
): FormFieldDefinition<'string', 'required'> {
    return {
        default: defaultValue,
        type: 'string',
        rules: ['required', ...((options.rules as 'required'[]) ?? [])],
    };
}

export function numberInput(defaultValue?: number, options: { rules?: string[] } = {}): FormFieldDefinition<'number'> {
    return {
        default: defaultValue,
        type: 'number',
        rules: options.rules,
    };
}

export function objectInput<T extends object>(
    defaultValue?: T,
    options: { rules?: string[] } = {},
): FormFieldDefinition<'object', string, T> {
    return {
        default: defaultValue,
        type: 'object',
        rules: options.rules,
    };
}

export function stringInput(defaultValue?: string, options: { rules?: string[] } = {}): FormFieldDefinition<'string'> {
    return {
        default: defaultValue,
        type: 'string',
        rules: options.rules,
    };
}
