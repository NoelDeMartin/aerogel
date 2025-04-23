<template>
    <div :class="rootClass">
        <label v-if="label" :for="expose.id" :class="labelClass">
            {{ label }}
        </label>
        <SwitchRoot
            :id="expose.id"
            :name
            :model-value="expose.value.value"
            v-bind="$attrs"
            :class="inputClass"
            @update:model-value="$emit('update:modelValue', $event)"
        >
            <SwitchThumb :class="thumbClass" />
        </SwitchRoot>
    </div>
</template>

<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'reka-ui';
import { computed, inject, readonly, watchEffect } from 'vue';
import { uuid } from '@noeldemartin/utils';
import type { HTMLAttributes } from 'vue';

import type FormController from '@aerogel/core/forms/FormController';
import type { FormFieldValue } from '@aerogel/core/forms/FormController';
import type { InputEmits, InputExpose, InputProps } from '@aerogel/core/components/contracts/Input';

defineOptions({ inheritAttrs: false });

const {
    name,
    label,
    description,
    modelValue,
    class: rootClass,
} = defineProps<
    InputProps<boolean> & {
        class?: HTMLAttributes['class'];
        labelClass?: HTMLAttributes['class'];
        inputClass?: HTMLAttributes['class'];
        thumbClass?: HTMLAttributes['class'];
    }
>();
const emit = defineEmits<InputEmits>();
const form = inject<FormController | null>('form', null);
const errors = computed(() => {
    if (!form || !name) {
        return null;
    }

    return form.errors[name] ?? null;
});

const expose = {
    id: `switch-${uuid()}`,
    name: computed(() => name),
    label: computed(() => label),
    description: computed(() => description),
    value: computed(() => {
        if (form && name) {
            return form.getFieldValue(name) as boolean;
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

defineExpose(expose);

watchEffect(() => {
    if (!description && !errors.value) {
        return;
    }

    // eslint-disable-next-line no-console
    console.warn('Errors and description not implemented in <HeadlessSwitch>');
});
</script>
