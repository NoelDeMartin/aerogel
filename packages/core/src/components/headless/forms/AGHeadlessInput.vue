<template>
    <component :is="as" v-if="as">
        <slot />
    </component>
    <slot v-else />
</template>

<script setup lang="ts">
import { computed, inject, provide, readonly } from 'vue';
import { uuid } from '@noeldemartin/utils';

import { stringProp } from '@/utils/vue';
import type Form from '@/forms/Form';

import type { IAGHeadlessInput } from './AGHeadlessInput';

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
    as: stringProp(),
    name: stringProp(),
    modelValue: stringProp(),
});
const errors = computed(() => {
    if (!form || !props.name) {
        return null;
    }

    return form.errors[props.name] ?? null;
});
const form = inject<Form>('form');
const publicApi: IAGHeadlessInput = {
    id: `input-${uuid()}`,
    value: computed(() => {
        if (form && props.name) {
            return form.getFieldValue(props.name);
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

provide<IAGHeadlessInput>('input', publicApi);
defineExpose<IAGHeadlessInput>(publicApi);
</script>
