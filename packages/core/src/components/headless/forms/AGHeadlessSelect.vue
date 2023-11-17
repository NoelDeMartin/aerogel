<template>
    <Listbox
        v-slot="{ value, open, disabled }: ComponentProps"
        :model-value="selectedOption?.value"
        @update:model-value="update($event)"
    >
        <slot :value="value" :open="open" :disabled="disabled" />
    </Listbox>
</template>

<script setup lang="ts">
import { computed, inject, provide } from 'vue';
import { isObject, toString, uuid } from '@noeldemartin/utils';
import { Listbox } from '@headlessui/vue';

import { mixedProp, stringProp } from '@/utils/vue';
import { translateWithDefault } from '@/lang/utils';
import type Form from '@/forms/Form';
import type { ComponentProps } from '@/utils/vue';

import { useSelectProps } from './AGHeadlessSelect';
import type { IAGHeadlessSelect, IAGSelectOption, IAGSelectOptionValue } from './AGHeadlessSelect';

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
    name: stringProp(),
    modelValue: mixedProp<IAGSelectOptionValue>(),
    ...useSelectProps(),
});
const form = inject<Form | null>('form', null);
const noSelectionText = computed(() => props.noSelectionText ?? translateWithDefault('select.noSelection', '-'));
const options = computed(() =>
    props.options.map((value) => {
        const option: IAGSelectOption = {
            value,
            text: toString(isObject(value) && 'text' in value ? value.text : value),
        };

        return option;
    }));
const selectedOption = computed(() => {
    const selectedOptionValue = form && props.name ? form.getFieldValue(props.name) : props.modelValue;

    return options.value.find((option) => option.value === selectedOptionValue);
});
const errors = computed(() => {
    if (!form || !props.name) {
        return null;
    }

    return form.errors[props.name] ?? null;
});

function update(value: IAGSelectOptionValue) {
    if (form && props.name) {
        form.setFieldValue(props.name, value);

        return;
    }

    emit('update:modelValue', value);
}

const api: IAGHeadlessSelect = {
    id: `select-${uuid()}`,
    options,
    noSelectionText,
    selectedOption,
    errors,
    label: computed(() => props.label),
    buttonText: computed(() => selectedOption.value?.text ?? noSelectionText.value),
    update,
};

provide<IAGHeadlessSelect>('select', api);
defineExpose<IAGHeadlessSelect>(api);
</script>
