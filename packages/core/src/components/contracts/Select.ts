import { computed, inject, provide, readonly } from 'vue';
import { evaluate, toString, uuid } from '@noeldemartin/utils';
import type { AcceptableValue, AsTag, SelectContentProps } from 'reka-ui';
import type { Component, ComputedRef, EmitFn, HTMLAttributes } from 'vue';
import type { Nullable } from '@noeldemartin/utils';

import { translateWithDefault } from '@aerogel/core/lang';
import type { FormController, FormFieldValue } from '@aerogel/core/forms';

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
    renderOption: (option: T) => string;
}

export function hasSelectOptionLabel(option: unknown): option is HasSelectOptionLabel {
    return typeof option === 'object' && option !== null && 'label' in option;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useSelect<T extends Nullable<FormFieldValue>>(props: SelectProps<T>, emit: EmitFn<SelectEmits<T>>) {
    const form = inject<FormController | null>('form', null);
    const renderOption = (option: T): string => {
        if (option === undefined) {
            return '';
        }

        return props.renderOption
            ? props.renderOption(option)
            : hasSelectOptionLabel(option)
                ? evaluate(option.label as string)
                : toString(option);
    };
    const computedValue = computed(() => {
        if (form && props.name) {
            return form.getFieldValue(props.name) as T;
        }

        return props.modelValue as T;
    });
    const acceptableValue = computed(() => computedValue.value as AcceptableValue);
    const errors = computed(() => {
        if (!form || !props.name) {
            return null;
        }

        return form.errors[props.name] ?? null;
    });
    const computedOptions = computed(() => {
        if (!props.options) {
            return null;
        }

        return props.options.map((option) => ({
            key: uuid(),
            label: renderOption(option),
            value: option as AcceptableValue,
        }));
    });

    const expose = {
        renderOption,
        labelClass: props.labelClass,
        optionsClass: props.optionsClass,
        align: props.align,
        side: props.side,
        value: computedValue,
        id: `select-${uuid()}`,
        name: computed(() => props.name),
        label: computed(() => props.label),
        description: computed(() => props.description),
        placeholder: computed(() => props.placeholder ?? translateWithDefault('ui.select', 'Select an option')),
        options: computedOptions,
        selectedOption: computed(() => computedOptions.value?.find((option) => option.value === props.modelValue)),
        errors: readonly(errors),
        required: computed(() => {
            if (!props.name || !form) {
                return;
            }

            return form.getFieldRules(props.name).includes('required');
        }),
        update(value) {
            if (form && props.name) {
                form.setFieldValue(props.name, value as FormFieldValue);

                return;
            }

            emit('update:modelValue', value);
        },
    } satisfies SelectExpose<T>;

    function update(value: AcceptableValue) {
        expose.update(value as T);
    }

    provide('select', expose);

    return { expose, acceptableValue, update, renderOption };
}
