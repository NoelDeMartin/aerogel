import type { ComputedRef, DeepReadonly, Ref } from 'vue';
import type { Nullable } from '@noeldemartin/utils';

import type { FormFieldValue } from '@aerogel/core/forms';

export interface InputProps<T extends Nullable<FormFieldValue> = Nullable<FormFieldValue>> {
    name?: string;
    label?: string;
    description?: string;
    modelValue?: T;
}

export interface InputEmits<T extends Nullable<FormFieldValue> = Nullable<FormFieldValue>> {
    'update:modelValue': [value: T];
}

export interface InputExpose<T extends Nullable<FormFieldValue> = Nullable<FormFieldValue>> {
    id: string;
    name: ComputedRef<Nullable<string>>;
    label: ComputedRef<Nullable<string>>;
    description: ComputedRef<Nullable<string | boolean>>;
    value: ComputedRef<T>;
    required: ComputedRef<Nullable<boolean>>;
    errors: DeepReadonly<Ref<Nullable<string[]>>>;
    update(value: T): void;
}
