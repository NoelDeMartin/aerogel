import Form from '@/forms/Form';
import type { FormData, FormFieldDefinitions } from '@/forms/Form';

export function useForm<T extends FormFieldDefinitions>(fields: T): Form<T> & FormData<T> {
    return new Form(fields) as Form<T> & FormData<T>;
}
