import FormController from '@aerogel/core/forms/FormController';
import type { FormData, FormFieldDefinitions } from '@aerogel/core/forms/FormController';

export function useForm<const T extends FormFieldDefinitions>(fields: T): FormController<T> & FormData<T> {
    return new FormController(fields) as FormController<T> & FormData<T>;
}
