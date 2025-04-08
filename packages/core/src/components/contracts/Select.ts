import type { AcceptableValue } from 'reka-ui';
import type { ComputedRef } from 'vue';
import type { Nullable } from '@noeldemartin/utils';

import type { InputEmits, InputExpose, InputProps } from './Input';

export type SelectOption = {
    key: string;
    label: string;
    value: AcceptableValue;
};

export interface HasSelectOptionLabel {
    label: string | (() => string);
}

export interface SelectProps extends InputProps {
    options?: unknown[];
    placeholder?: string;
    renderOption?: (option: unknown) => string;
}

export interface SelectEmits extends InputEmits {}

export interface SelectExpose extends InputExpose {
    options: ComputedRef<Nullable<SelectOption[]>>;
    selectedOption: ComputedRef<Nullable<SelectOption>>;
    placeholder: ComputedRef<string>;
}

export function hasSelectOptionLabel(option: unknown): option is HasSelectOptionLabel {
    return typeof option === 'object' && option !== null && 'label' in option;
}
