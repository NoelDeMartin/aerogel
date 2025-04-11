<template>
    <SelectRoot
        v-slot="{ open }"
        :model-value="acceptableValue"
        :by="(a, b) => a === b"
        @update:model-value="update($event)"
    >
        <component :is="as" v-bind="$attrs">
            <slot :model-value :open>
                <HeadlessSelectTrigger />
                <HeadlessSelectOptions />
            </slot>
        </component>
    </SelectRoot>
</template>

<script setup lang="ts" generic="T extends Nullable<FormFieldValue>">
import { computed, inject, provide, readonly } from 'vue';
import { value as evaluate, toString, uuid } from '@noeldemartin/utils';
import { SelectRoot } from 'reka-ui';
import type { AcceptableValue } from 'reka-ui';
import type { Nullable } from '@noeldemartin/utils';

import { translateWithDefault } from '@aerogel/core/lang';
import { hasSelectOptionLabel } from '@aerogel/core/components/contracts/Select';
import type FormController from '@aerogel/core/forms/FormController';
import type { SelectEmits, SelectExpose, SelectProps } from '@aerogel/core/components/contracts/Select';
import type { FormFieldValue } from '@aerogel/core/forms/FormController';

import HeadlessSelectTrigger from './HeadlessSelectTrigger.vue';
import HeadlessSelectOptions from './HeadlessSelectOptions.vue';

defineOptions({ inheritAttrs: false });

const {
    name,
    as = 'div',
    label,
    options,
    labelClass,
    optionsClass,
    renderOption,
    description,
    placeholder,
    modelValue,
    align,
    side,
} = defineProps<SelectProps<T>>();
const emit = defineEmits<SelectEmits<T>>();
const form = inject<FormController | null>('form', null);
const computedValue = computed(() => {
    if (form && name) {
        return form.getFieldValue(name) as T;
    }

    return modelValue as T;
});
const acceptableValue = computed(() => computedValue.value as AcceptableValue);
const errors = computed(() => {
    if (!form || !name) {
        return null;
    }

    return form.errors[name] ?? null;
});
const computedOptions = computed(() => {
    if (!options) {
        return null;
    }

    return options.map((option) => ({
        key: uuid(),
        label: renderOption
            ? renderOption(option)
            : hasSelectOptionLabel(option)
                ? evaluate(option.label as string)
                : toString(option),
        value: option as AcceptableValue,
    }));
});
const expose = {
    labelClass,
    optionsClass,
    align,
    side,
    value: computedValue,
    id: `select-${uuid()}`,
    name: computed(() => name),
    label: computed(() => label),
    description: computed(() => description),
    placeholder: computed(() => placeholder ?? translateWithDefault('ui.select', 'Select an option')),
    options: computedOptions,
    selectedOption: computed(() => computedOptions.value?.find((option) => option.value === modelValue)),
    errors: readonly(errors),
    required: computed(() => {
        if (!name || !form) {
            return;
        }

        return form.getFieldRules(name).includes('required');
    }),
    update(value) {
        if (form && name) {
            form.setFieldValue(name, value as FormFieldValue);

            return;
        }

        emit('update:modelValue', value);
    },
} satisfies SelectExpose<T>;

function update(value: AcceptableValue) {
    expose.update(value as T);
}

provide('select', expose);
defineExpose(expose);
</script>
