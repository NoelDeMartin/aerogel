import { computed, inject, provide, readonly } from 'vue';
import { evaluate, toString, uuid } from '@noeldemartin/utils';
import type { AcceptRefs } from '@aerogel/core/utils';
import type { AcceptableValue, AsTag, SelectContentProps } from 'reka-ui';
import type { Component, ComputedRef, EmitFn, HTMLAttributes, Ref } from 'vue';
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
    labelClass: ComputedRef<HTMLAttributes['class']>;
    optionsClass: ComputedRef<HTMLAttributes['class']>;
    align?: SelectContentProps['align'];
    side?: SelectContentProps['side'];
    renderOption: (option: T) => string;
}

export function hasSelectOptionLabel(option: unknown): option is HasSelectOptionLabel {
    return typeof option === 'object' && option !== null && 'label' in option;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useSelect<T extends Nullable<FormFieldValue>>(
    props: Ref<SelectProps<T>>,
    emit: EmitFn<SelectEmits<T>>,
) {
    const form = inject<FormController | null>('form', null);
    const renderOption = (option: T): string => {
        if (option === undefined) {
            return '';
        }

        return props.value.renderOption
            ? props.value.renderOption(option)
            : hasSelectOptionLabel(option)
                ? evaluate(option.label as string)
                : toString(option);
    };
    const computedValue = computed(() => {
        const { name, modelValue } = props.value;

        if (form && name) {
            return form.getFieldValue(name) as T;
        }

        return modelValue as T;
    });
    const acceptableValue = computed(() => computedValue.value as AcceptableValue);
    const errors = computed(() => {
        if (!form || !props.value.name) {
            return null;
        }

        return form.errors[props.value.name] ?? null;
    });
    const computedOptions = computed(() => {
        if (!props.value.options) {
            return null;
        }

        return props.value.options.map((option) => ({
            key: uuid(),
            label: renderOption(option),
            value: option as AcceptableValue,
        }));
    });

    const expose = {
        renderOption,
        labelClass: computed(() => props.value.labelClass),
        optionsClass: computed(() => props.value.optionsClass),
        align: computed(() => props.value.align),
        side: computed(() => props.value.side),
        value: computedValue,
        id: `select-${uuid()}`,
        name: computed(() => props.value.name),
        label: computed(() => props.value.label),
        description: computed(() => props.value.description),
        placeholder: computed(() => props.value.placeholder ?? translateWithDefault('ui.select', 'Select an option')),
        options: computedOptions,
        selectedOption: computed(() =>
            computedOptions.value?.find((option) => option.value === props.value.modelValue)),
        errors: readonly(errors),
        required: computed(() => {
            if (!props.value.name || !form) {
                return;
            }

            return form.getFieldRules(props.value.name).includes('required');
        }),
        update(value) {
            if (form && props.value.name) {
                form.setFieldValue(props.value.name, value as FormFieldValue);

                return;
            }

            emit('update:modelValue', value);
        },
    } satisfies AcceptRefs<SelectExpose<T>>;

    function update(value: AcceptableValue) {
        expose.update(value as T);
    }

    provide('select', expose);

    return { expose, acceptableValue, update, renderOption };
}
