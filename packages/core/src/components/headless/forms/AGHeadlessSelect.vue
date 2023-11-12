<template>
    <Listbox :model-value="publicApi.value.value" @update:model-value="publicApi.update($event)">
        <slot />
    </Listbox>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import { Listbox } from '@headlessui/vue';

import { mixedProp, stringProp } from '@/utils/vue';
import type Form from '@/forms/Form';

import { useSelectProps } from './AGHeadlessSelect';
import type { IAGHeadlessSelect, SelectOptionValue } from './AGHeadlessSelect';

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
    name: stringProp(),
    modelValue: mixedProp<SelectOptionValue>(),
    ...useSelectProps(),
});
const form = inject<Form | null>('form', null);
const publicApi: IAGHeadlessSelect = {
    value: computed(() => {
        if (form && props.name) {
            return form.getFieldValue(props.name);
        }

        return props.modelValue;
    }),
    options: props.options,
    update(value) {
        if (form && props.name) {
            form.setFieldValue(props.name, value);

            return;
        }

        emit('update:modelValue', value);
    },
};

defineExpose<IAGHeadlessSelect>(publicApi);
</script>
