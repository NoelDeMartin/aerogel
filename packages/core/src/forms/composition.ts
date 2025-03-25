import Form from '@aerogel/core/forms/Form';
import type { FormData, FormFieldDefinitions } from '@aerogel/core/forms/Form';

export function useForm<const T extends FormFieldDefinitions>(fields: T): Form<T> & FormData<T> {
    return new Form(fields) as Form<T> & FormData<T>;
}
