import type { ComputedRef, DeepReadonly, Ref } from 'vue';
import type { Nullable } from '@noeldemartin/utils';

import type { FormFieldValue } from '@aerogel/core/forms';

export interface InputProps {
    name?: string;
    label?: string;
    description?: string;
    modelValue?: FormFieldValue;
}

export interface InputEmits {
    (event: 'update:modelValue', value: Nullable<FormFieldValue>): void;
}

export interface InputExpose {
    id: string;
    name: ComputedRef<Nullable<string>>;
    label: ComputedRef<Nullable<string>>;
    description: ComputedRef<Nullable<string | boolean>>;
    value: ComputedRef<Nullable<FormFieldValue>>;
    required: ComputedRef<Nullable<boolean>>;
    errors: DeepReadonly<Ref<Nullable<string[]>>>;
    update(value: Nullable<FormFieldValue>): void;
}
