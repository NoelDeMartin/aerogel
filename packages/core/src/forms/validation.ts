import { arrayFrom } from '@noeldemartin/utils';

const builtInRules: Record<string, FormFieldValidator> = {
    required: (value) => (value ? undefined : 'required'),
};

export type FormFieldValidator<T = unknown> = (value: T) => string | string[] | undefined;

export const validators: Record<string, FormFieldValidator> = { ...builtInRules };

export function defineFormValidationRule<T>(rule: string, validator: FormFieldValidator<T>): void {
    validators[rule] = validator as FormFieldValidator;
}

export function validate(value: unknown, rule: string): string[] {
    const errors = validators[rule]?.(value);

    return errors ? arrayFrom(errors) : [];
}
