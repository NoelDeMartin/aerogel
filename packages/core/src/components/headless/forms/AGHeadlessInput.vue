<template>
    <component :is="as" v-if="as">
        <slot />
    </component>
    <slot v-else />
</template>

<script setup lang="ts">
import { computed, inject, provide, readonly } from 'vue';
import { uuid } from '@noeldemartin/utils';

import { mixedProp, stringProp } from '@/utils/vue';
import type Form from '@/forms/Form';

import { useInputProps } from './AGHeadlessInput';
import type { IAGHeadlessInput } from './AGHeadlessInput';

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
    as: stringProp('div'),
    modelValue: mixedProp<string | number | boolean>([String, Number, Boolean]),
    ...useInputProps(),
});
const errors = computed(() => {
    if (!form || !props.name) {
        return null;
    }

    return form.errors[props.name] ?? null;
});
const form = inject<Form | null>('form', null);
const api: IAGHeadlessInput = {
    id: `input-${uuid()}`,
    name: computed(() => props.name),
    label: computed(() => props.label),
    description: computed(() => props.description),
    value: computed(() => {
        if (form && props.name) {
            return form.getFieldValue(props.name) as string | number | boolean | null;
        }

        return props.modelValue;
    }),
    errors: readonly(errors),
    update(value) {
        if (form && props.name) {
            form.setFieldValue(props.name, value);

            return;
        }

        emit('update:modelValue', value);
    },
};

provide<IAGHeadlessInput>('input', api);
defineExpose<IAGHeadlessInput>(api);
</script>
