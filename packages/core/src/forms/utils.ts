import { FormFieldTypes } from './Form';
import type { FormFieldDefinition } from './Form';

export function booleanInput(defaultValue?: boolean): FormFieldDefinition<typeof FormFieldTypes.Boolean> {
    return {
        default: defaultValue,
        type: FormFieldTypes.Boolean,
    };
}

export function dateInput(defaultValue?: Date): FormFieldDefinition<typeof FormFieldTypes.Date> {
    return {
        default: defaultValue,
        type: FormFieldTypes.Date,
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

export function numberInput(defaultValue?: number): FormFieldDefinition<typeof FormFieldTypes.Number> {
    return {
        default: defaultValue,
        type: FormFieldTypes.Number,
    };
}

export function stringInput(defaultValue?: string): FormFieldDefinition<typeof FormFieldTypes.String> {
    return {
        default: defaultValue,
        type: FormFieldTypes.String,
    };
}
