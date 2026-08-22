<template>
    <component :is="as">
        <slot />
    </component>
</template>

<script setup lang="ts">
import { computed, inject, provide, readonly, ref } from 'vue';
import { uuid } from '@noeldemartin/utils';
import type { Nullable } from '@noeldemartin/utils';

import type FormController from '@aerogel/core/forms/FormController';
import type { FormFieldValue } from '@aerogel/core/forms/FormController';
import type {
    FormControlEmits,
    FormControlExpose,
    FormControlProps,
} from '@aerogel/core/components/contracts/FormControl';

const { as = 'div', name, label, description, modelValue } = defineProps<FormControlProps & { as?: string }>();
const emit = defineEmits<FormControlEmits>();
const form = inject<FormController | null>('form', null);
const errors = computed(() => {
    if (!form || !name) {
        return null;
    }

    return form.errors[name] ?? null;
});

const $control = ref<HTMLElement | null>(null);

const expose = {
    $control,
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
    focus() {
        $control.value?.focus();
    },
    blur() {
        $control.value?.blur();
    },
} satisfies FormControlExpose<Nullable<FormFieldValue>, HTMLElement>;

provide('form-control', expose);
defineExpose(expose);
</script>
