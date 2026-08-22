import { computed, provide, ref, watch } from 'vue';
import type { AcceptableValue } from 'reka-ui';
import type { EmitFn, Ref } from 'vue';
import type { Nullable } from '@noeldemartin/utils';

import type { FormFieldValue } from '@aerogel/core/forms';

import { useSelect } from './Select';
import type { SelectEmits, SelectExpose, SelectProps } from './Select';
import type { AcceptRefs } from '@aerogel/core/utils';

export interface ComboboxExpose<T extends Nullable<FormFieldValue> = Nullable<FormFieldValue>> extends SelectExpose<T> {
    input: Ref<string>;
    preventChange: Ref<boolean>;
    $group: Ref<HTMLDivElement | null>;
}

export interface ComboboxProps<T extends Nullable<FormFieldValue> = Nullable<FormFieldValue>> extends SelectProps<T> {
    newInputValue?: (value: string) => T;
}

export type ComboboxEmits<T extends Nullable<FormFieldValue> = Nullable<FormFieldValue>> = SelectEmits<T> & {
    'update:open': [value: boolean];
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useCombobox<T extends Nullable<FormFieldValue>>(
    props: Ref<ComboboxProps<T>>,
    emit: EmitFn<ComboboxEmits<T>>,
) {
    const {
        expose: selectExpose,
        acceptableValue,
        update: baseUpdate,
        renderOption,
    } = useSelect(
        computed(() => ({
            as: props.value.as ?? 'div',
            compareOptions: props.value.compareOptions ?? ((a, b) => a === b),
            ...props.value,
        })),
        emit,
    );

    const optionsByLabel = computed(() =>
        Object.fromEntries(expose.options.value?.map((option) => [option.label, option.value]) ?? []));

    const expose = {
        ...selectExpose,
        input: ref(acceptableValue.value ? renderOption(acceptableValue.value as T) : ''),
        preventChange: ref(false),
        $group: ref(null),
    } satisfies AcceptRefs<ComboboxExpose<T>>;

    function update(value: AcceptableValue) {
        if (props.value.options || props.value.newInputValue) {
            expose.input.value = renderOption(value as T);
        }

        baseUpdate(value);
    }

    watch(expose.value, (value) => {
        if (!props.value.options && !props.value.newInputValue) {
            return;
        }

        const newOptionLabel = renderOption(value as T);

        if (expose.input.value === newOptionLabel) {
            return;
        }

        expose.preventChange.value = true;
        expose.input.value = newOptionLabel;
    });

    watch(expose.input, (value) => {
        if (!props.value.options && !props.value.newInputValue) {
            return;
        }

        const newInputOption = props.value.newInputValue
            ? (props.value.newInputValue(value) as AcceptableValue)
            : value;
        const newInputOptionLabel = renderOption(newInputOption as T);

        if (newInputOptionLabel in optionsByLabel.value) {
            update(optionsByLabel.value[newInputOptionLabel] as AcceptableValue);

            return;
        }

        update(newInputOption);
    });

    provide('combobox', expose);

    return { expose, acceptableValue, update, renderOption };
}
