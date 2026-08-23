import type { ComputedRef, DeepReadonly, Ref } from 'vue';
import type { Nullable } from '@noeldemartin/utils';

import type { FormFieldValue } from '@aerogel/core/forms';

import type { ElementMethods } from './helpers';

export interface FormControlProps<T extends Nullable<FormFieldValue> = Nullable<FormFieldValue>> {
    name?: string;
    label?: string;
    description?: string;
    modelValue?: T;
}

export interface FormControlEmits<T extends Nullable<FormFieldValue> = Nullable<FormFieldValue>> {
    'update:modelValue': [value: T];
}

export interface FormControlExpose<
    T extends Nullable<FormFieldValue> = Nullable<FormFieldValue>,
    TControlElement extends HTMLElement = HTMLElement,
> extends ElementMethods {
    $control: Ref<TControlElement | null>;
    id: string;
    name: ComputedRef<Nullable<string>>;
    label: ComputedRef<Nullable<string>>;
    description: ComputedRef<Nullable<string | boolean>>;
    value: ComputedRef<T>;
    required: ComputedRef<Nullable<boolean>>;
    errors: DeepReadonly<Ref<Nullable<string[]>>>;
    update(value: T): void;
}
