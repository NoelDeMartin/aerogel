<template>
    <SelectRoot v-slot="{ open }: ComponentProps" :model-value="acceptableValue" @update:model-value="update($event)">
        <slot :model-value :open>
            <HeadlessSelectTrigger />
            <HeadlessSelectOptions />
        </slot>
    </SelectRoot>
</template>

<script setup lang="ts">
import { computed, inject, provide, readonly } from 'vue';
import { value as evaluate, toString, uuid } from '@noeldemartin/utils';
import { SelectRoot } from 'reka-ui';
import type { AcceptableValue } from 'reka-ui';

import { translateWithDefault } from '@aerogel/core/lang';
import { hasSelectOptionLabel } from '@aerogel/core/components/contracts/Select';
import type FormController from '@aerogel/core/forms/FormController';
import type { ComponentProps } from '@aerogel/core/utils/vue';
import type { SelectEmits, SelectExpose, SelectProps } from '@aerogel/core/components/contracts/Select';
import type { FormFieldValue } from '@aerogel/core/forms/FormController';

import HeadlessSelectTrigger from './HeadlessSelectTrigger.vue';
import HeadlessSelectOptions from './HeadlessSelectOptions.vue';

const { name, label, options, renderOption, description, placeholder, modelValue } = defineProps<SelectProps>();
const emit = defineEmits<SelectEmits>();
const form = inject<FormController | null>('form', null);
const acceptableValue = computed(() => modelValue as AcceptableValue);
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
const context = {
    id: `select-${uuid()}`,
    name: computed(() => name),
    label: computed(() => label),
    description: computed(() => description),
    placeholder: computed(() => placeholder ?? translateWithDefault('ui.select', 'Select an option')),
    options: computedOptions,
    selectedOption: computed(() => computedOptions.value?.find((option) => option.value === modelValue)),
    value: computed(() => {
        if (form && name) {
            return form.getFieldValue(name);
        }

        return modelValue;
    }),
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
} satisfies SelectExpose;

function update(value: AcceptableValue) {
    context.update(value as FormFieldValue);
}

provide('select', context);
defineExpose(context);
</script>
