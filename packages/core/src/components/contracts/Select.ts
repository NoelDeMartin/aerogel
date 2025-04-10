import type { AcceptableValue, AsTag, SelectContentProps } from 'reka-ui';
import type { Component, ComputedRef, HTMLAttributes } from 'vue';
import type { Nullable } from '@noeldemartin/utils';

import type { InputEmits, InputExpose, InputProps } from './Input';

export type SelectOptionData = {
    key: string;
    label: string;
    value: AcceptableValue;
};

export interface HasSelectOptionLabel {
    label: string | (() => string);
}

export interface SelectProps extends InputProps {
    as?: AsTag | Component;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options?: any[];
    placeholder?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderOption?: (option: any) => string;
    labelClass?: HTMLAttributes['class'];
    optionsClass?: HTMLAttributes['class'];
    align?: SelectContentProps['align'];
    side?: SelectContentProps['side'];
}

export interface SelectEmits extends InputEmits {}

export interface SelectExpose extends InputExpose {
    options: ComputedRef<Nullable<SelectOptionData[]>>;
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
