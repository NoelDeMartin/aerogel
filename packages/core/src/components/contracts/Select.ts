import { computed, inject, provide, readonly, ref } from 'vue';
import { evaluate, toString, uuid } from '@noeldemartin/utils';
import type { AcceptRefs } from '@aerogel/core/utils';
import type { AcceptableValue, AsTag, SelectContentProps } from 'reka-ui';
import type { Component, ComputedRef, EmitFn, HTMLAttributes, Ref } from 'vue';
import type { Nullable } from '@noeldemartin/utils';

import { translateWithDefault } from '@aerogel/core/lang';
import type { FormController } from '@aerogel/core/forms';

import { exposeElementMethods } from './helpers';
import type { FormControlEmits, FormControlExpose, FormControlProps } from './FormControl';

export type SelectOptionData = {
    key: string;
    label: string;
    value: AcceptableValue;
};

export interface HasSelectOptionLabel {
    label: string | (() => string);
}

export interface SelectProps<T = unknown> extends FormControlProps<T | T[]> {
    as?: AsTag | Component;
    multiple?: boolean;
    options?: readonly T[];
    placeholder?: string;
    renderOption?: (option: T) => string;
    compareOptions?: (a: T, b: T) => boolean;
    labelClass?: HTMLAttributes['class'];
    optionsClass?: HTMLAttributes['class'];
    align?: SelectContentProps['align'];
    side?: SelectContentProps['side'];
}

export interface SelectEmits<T = unknown> extends FormControlEmits<T | T[]> {}

export interface SelectExpose<T = unknown, TControlElement extends HTMLElement = HTMLElement>
    extends FormControlExpose<T | T[], TControlElement> {
    options: ComputedRef<Nullable<readonly SelectOptionData[]>>;
    selectedOption: ComputedRef<Nullable<SelectOptionData>>;
    selectedOptions: ComputedRef<readonly SelectOptionData[]>;
    selectedItems: ComputedRef<T[]>;
    multiple: ComputedRef<boolean>;
    placeholder: ComputedRef<string>;
    labelClass: ComputedRef<HTMLAttributes['class']>;
    optionsClass: ComputedRef<HTMLAttributes['class']>;
    align?: SelectContentProps['align'];
    side?: SelectContentProps['side'];
    renderOption: (option: T) => string;
    remove(item: T): void;
}

export function hasSelectOptionLabel(option: unknown): option is HasSelectOptionLabel {
    return typeof option === 'object' && option !== null && 'label' in option;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useSelect<T, TControlElement extends HTMLElement = HTMLElement>(
    props: Ref<SelectProps<T>>,
    emit: EmitFn<SelectEmits<T>>,
) {
    const $control = ref<TControlElement | null>(null) as Ref<TControlElement | null>;
    const form = inject<FormController | null>('form', null);

    const isMultiple = computed(() => {
        const { multiple, name } = props.value;

        return !!multiple || !!(form && name && form.isArrayField(name));
    });

    const compareOptions = (a: T, b: T): boolean =>
        (props.value.compareOptions ? props.value.compareOptions(a, b) : a === b);

    const renderOption = (option: T): string => {
        if (option === undefined || option === null) {
            return '';
        }

        return props.value.renderOption
            ? props.value.renderOption(option)
            : hasSelectOptionLabel(option)
                ? evaluate(option.label as string)
                : toString(option);
    };

    const rawValue = computed(() => {
        const { name, modelValue } = props.value;

        return form && name ? (form.getFieldValue(name) as T | T[] | undefined) : modelValue;
    });

    const selectedItems = computed<T[]>(() => {
        if (!isMultiple.value) {
            return [];
        }

        return Array.isArray(rawValue.value) ? rawValue.value : [];
    });

    const computedValue = computed<T | T[]>(() => (isMultiple.value ? selectedItems.value : (rawValue.value as T)));
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

    const selectedOptions = computed(() => {
        if (!computedOptions.value) {
            return [];
        }

        if (isMultiple.value) {
            return computedOptions.value.filter((option) => {
                return selectedItems.value.some((item) => compareOptions(option.value as T, item));
            });
        }

        const match = computedOptions.value.find((option) => {
            return compareOptions(option.value as T, computedValue.value as T);
        });

        return match ? [match] : [];
    });

    const selectedOption = computed(() => selectedOptions.value[0] ?? null);

    function update(value: AcceptableValue) {
        const newValue = isMultiple.value ? (Array.isArray(value) ? (value as T[]) : []) : (value as T);

        if (form && props.value.name) {
            form.setFieldValue(props.value.name, newValue);

            return;
        }

        emit('update:modelValue', newValue);
    }

    function remove(item: T) {
        if (!isMultiple.value) {
            return;
        }

        const newValue = selectedItems.value.filter((val) => !compareOptions(val, item));

        update(newValue as unknown as AcceptableValue);
    }

    const expose = {
        renderOption,
        $control,
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
        selectedOption,
        selectedOptions,
        selectedItems,
        multiple: isMultiple,
        remove,
        errors: readonly(errors),
        required: computed(() => {
            if (!props.value.name || !form) {
                return;
            }

            return form.isFieldRequired(props.value.name);
        }),
        update: value => update(value as AcceptableValue),
        ...exposeElementMethods(() => $control.value),
    } satisfies AcceptRefs<SelectExpose<T, TControlElement>>;

    provide('select', expose);

    return {
        expose,
        acceptableValue,
        update,
        renderOption,
        isMultiple,
        selectedItems,
    };
}
