import FormController from '@aerogel/core/forms/FormController';
import type { FormFieldDefinitions, FormValues } from '@aerogel/core/forms/FormController';

export function useForm<const T extends FormFieldDefinitions>(fields: T): FormController<T> & FormValues<T> {
    return new FormController(fields) as FormController<T> & FormValues<T>;
}
