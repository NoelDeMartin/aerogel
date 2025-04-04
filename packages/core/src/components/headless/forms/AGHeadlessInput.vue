<template>
    <component :is="as" v-if="as">
        <slot />
    </component>
    <slot v-else />
</template>

<script setup lang="ts">
import { computed, inject, provide, readonly, ref } from 'vue';
import { uuid } from '@noeldemartin/utils';

import { stringProp } from '@aerogel/core/utils/vue';
import type FormController from '@aerogel/core/forms/FormController';
import type { __SetsElement } from '@aerogel/core/components/contracts/shared';

import { useInputProps } from './AGHeadlessInput';
import type { IAGHeadlessInput } from './AGHeadlessInput';

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
    as: stringProp('div'),
    ...useInputProps(),
});
const $el = ref<HTMLElement>();
const errors = computed(() => {
    if (!form || !props.name) {
        return null;
    }

    return form.errors[props.name] ?? null;
});
const form = inject<FormController | null>('form', null);
const api: IAGHeadlessInput & __SetsElement = {
    $el,
    id: `input-${uuid()}`,
    name: computed(() => props.name),
    label: computed(() => props.label),
    description: computed(() => props.description),
    value: computed(() => {
        if (form && props.name) {
            return form.getFieldValue(props.name);
        }

        return props.modelValue;
    }),
    errors: readonly(errors),
    required: computed(() => {
        if (!props.name || !form) {
            return null;
        }

        return form.getFieldRules(props.name).includes('required');
    }),
    update(value) {
        if (form && props.name) {
            form.setFieldValue(props.name, value);

            return;
        }

        emit('update:modelValue', value);
    },
    __setElement(element) {
        $el.value = element;
    },
};

provide<IAGHeadlessInput>('input', api);
defineExpose<IAGHeadlessInput>(api);
</script>
