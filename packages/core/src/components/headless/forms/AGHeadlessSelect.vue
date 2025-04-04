<template>
    <SelectRoot v-slot="{ open }: ComponentProps" :model-value="selectedOption" @update:model-value="update($event)">
        <slot :model-value="modelValue" :open="open" />
    </SelectRoot>
</template>

<script setup lang="ts">
import { computed, inject, provide } from 'vue';
import { toString, uuid } from '@noeldemartin/utils';
import { SelectRoot } from 'reka-ui';
import type { AcceptableValue } from 'reka-ui';

import { mixedProp } from '@aerogel/core/utils/vue';
import { translateWithDefault } from '@aerogel/core/lang/utils';
import type FormController from '@aerogel/core/forms/FormController';
import type { FormFieldValue } from '@aerogel/core/forms/FormController';
import type { ComponentProps } from '@aerogel/core/utils/vue';

import { useSelectEmits, useSelectProps } from './AGHeadlessSelect';
import type { IAGHeadlessSelect } from './AGHeadlessSelect';

const emit = defineEmits(useSelectEmits());
const props = defineProps({
    modelValue: mixedProp<FormFieldValue>(),
    ...useSelectProps(),
});
const renderText = computed(() => {
    if (typeof props.optionsText === 'function') {
        return props.optionsText;
    }

    if (typeof props.optionsText === 'string') {
        return (option: FormFieldValue): string => toString(option[props.optionsText as keyof FormFieldValue]);
    }

    return (option: FormFieldValue) => toString(option);
});
const form = inject<FormController | null>('form', null);
const noSelectionText = computed(() => props.noSelectionText ?? translateWithDefault('select.noSelection', '-'));
const selectedOption = computed(
    () => (form && props.name ? form.getFieldValue(props.name) : props.modelValue) as AcceptableValue,
);
const errors = computed(() => {
    if (!form || !props.name) {
        return null;
    }

    return form.errors[props.name] ?? null;
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function update(value: any) {
    if (form && props.name) {
        form.setFieldValue(props.name, value);

        return;
    }

    emit('update:modelValue', value);
}

const api: IAGHeadlessSelect = {
    id: `select-${uuid()}`,
    noSelectionText,
    selectedOption,
    errors,
    options: computed(() => props.options),
    label: computed(() => props.label),
    buttonText: computed(() =>
        selectedOption.value === null ? noSelectionText.value : renderText.value(selectedOption.value)),
    renderText,
    update,
};

provide<IAGHeadlessSelect>('select', api);
defineExpose<IAGHeadlessSelect>(api);
</script>
