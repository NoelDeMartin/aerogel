import { FormFieldTypes } from './FormController';
import type { FormFieldDefinition } from './FormController';

export function booleanInput(
    defaultValue?: boolean,
    options: { rules?: string } = {},
): FormFieldDefinition<typeof FormFieldTypes.Boolean> {
    return {
        default: defaultValue,
        type: FormFieldTypes.Boolean,
        rules: options.rules,
    };
}

export function dateInput(
    defaultValue?: Date,
    options: { rules?: string } = {},
): FormFieldDefinition<typeof FormFieldTypes.Date> {
    return {
        default: defaultValue,
        type: FormFieldTypes.Date,
        rules: options.rules,
    };
}

export function requiredBooleanInput(
    defaultValue?: boolean,
): FormFieldDefinition<typeof FormFieldTypes.Boolean, 'required'> {
    return {
        default: defaultValue,
        type: FormFieldTypes.Boolean,
        rules: 'required',
    };
}

export function requiredDateInput(defaultValue?: Date): FormFieldDefinition<typeof FormFieldTypes.Date> {
    return {
        default: defaultValue,
        type: FormFieldTypes.Date,
        rules: 'required',
    };
}

export function requiredNumberInput(
    defaultValue?: number,
): FormFieldDefinition<typeof FormFieldTypes.Number, 'required'> {
    return {
        default: defaultValue,
        type: FormFieldTypes.Number,
        rules: 'required',
    };
}

export function requiredStringInput(
    defaultValue?: string,
): FormFieldDefinition<typeof FormFieldTypes.String, 'required'> {
    return {
        default: defaultValue,
        type: FormFieldTypes.String,
        rules: 'required',
    };
}

export function numberInput(
    defaultValue?: number,
    options: { rules?: string } = {},
): FormFieldDefinition<typeof FormFieldTypes.Number> {
    return {
        default: defaultValue,
        type: FormFieldTypes.Number,
        rules: options.rules,
    };
}

export function stringInput(
    defaultValue?: string,
    options: { rules?: string } = {},
): FormFieldDefinition<typeof FormFieldTypes.String> {
    return {
        default: defaultValue,
        type: FormFieldTypes.String,
        rules: options.rules,
    };
}
