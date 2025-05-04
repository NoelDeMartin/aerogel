import type { AcceptableValue, AsTag, SelectContentProps } from 'reka-ui';
import type { Component, ComputedRef, HTMLAttributes } from 'vue';
import type { Nullable } from '@noeldemartin/utils';

import type { FormFieldValue } from '@aerogel/core/forms';

import type { InputEmits, InputExpose, InputProps } from './Input';

export type SelectOptionData = {
    key: string;
    label: string;
    value: AcceptableValue;
};

export interface HasSelectOptionLabel {
    label: string | (() => string);
}

export interface SelectProps<T extends Nullable<FormFieldValue> = Nullable<FormFieldValue>> extends InputProps<T> {
    as?: AsTag | Component;
    options?: readonly T[];
    placeholder?: string;
    renderOption?: (option: T) => string;
    compareOptions?: (a: T, b: T) => boolean;
    labelClass?: HTMLAttributes['class'];
    optionsClass?: HTMLAttributes['class'];
    align?: SelectContentProps['align'];
    side?: SelectContentProps['side'];
}

export interface SelectEmits<T extends Nullable<FormFieldValue> = Nullable<FormFieldValue>> extends InputEmits<T> {}

export interface SelectExpose<T extends Nullable<FormFieldValue> = Nullable<FormFieldValue>> extends InputExpose<T> {
    options: ComputedRef<Nullable<readonly SelectOptionData[]>>;
    selectedOption: ComputedRef<Nullable<SelectOptionData>>;
    placeholder: ComputedRef<string>;
    labelClass?: HTMLAttributes['class'];
    optionsClass?: HTMLAttributes['class'];
    align?: SelectContentProps['align'];
    side?: SelectContentProps['side'];
}

export function hasSelectOptionLabel(option: unknown): option is HasSelectOptionLabel {
    return typeof option === 'object' && option !== null && 'label' in option;
}
