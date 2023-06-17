<template>
    <input
        ref="$input"
        :value="value"
        :type="type"
        @input="update"
    >
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue';

import { enumProp, stringProp } from '@/utils/vue';
import type Form from '@/forms/Form';

import { AGHeadlessInputTypes } from './AGHeadlessInput';

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
    name: stringProp(),
    type: enumProp(AGHeadlessInputTypes, AGHeadlessInputTypes.Text),
    modelValue: stringProp(),
});
const $input = ref<HTMLInputElement>();
const form = inject<Form>('form');
const value = computed(() => {
    if (form && props.name) {
        return form.getFieldValue(props.name);
    }

    return props.modelValue;
});

function update() {
    if (!$input.value) {
        return;
    }

    if (form && props.name) {
        form.setFieldValue(props.name, $input.value.value);

        return;
    }

    emit('update:modelValue', $input.value.value);
}
</script>
