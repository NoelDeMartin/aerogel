<template>
    <component :is="as">
        <slot />
    </component>
</template>

<script setup lang="ts">
import { computed, inject, provide, readonly } from 'vue';
import { uuid } from '@noeldemartin/utils';

import type FormController from '@aerogel/core/forms/FormController';
import type { FormFieldValue } from '@aerogel/core/forms/FormController';
import type { InputEmits, InputExpose, InputProps } from '@aerogel/core/components/contracts/Input';

const { as = 'div', name, label, description, modelValue } = defineProps<InputProps & { as?: string }>();
const emit = defineEmits<InputEmits>();
const form = inject<FormController | null>('form', null);
const errors = computed(() => {
    if (!form || !name) {
        return null;
    }

    return form.errors[name] ?? null;
});

const context = {
    id: `input-${uuid()}`,
    name: computed(() => name),
    label: computed(() => label),
    description: computed(() => description),
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
} satisfies InputExpose;

provide('input', context);
defineExpose(context);
</script>
