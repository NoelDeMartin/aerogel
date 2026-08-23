<template>
    <div :class="rootClass">
        <label v-if="label" :for="expose.id" :class="labelClass">
            {{ label }}
        </label>
        <SwitchRoot
            :id="expose.id"
            ref="$rootRef"
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

<script setup lang="ts" generic="T extends boolean = boolean">
import { SwitchRoot, SwitchThumb } from 'reka-ui';
import { computed, inject, readonly, ref, useTemplateRef, watchEffect } from 'vue';
import { uuid } from '@noeldemartin/utils';
import type { ComponentPublicInstance, HTMLAttributes } from 'vue';

import { exposeElementMethods } from '@aerogel/core/components/contracts/helpers';
import type FormController from '@aerogel/core/forms/FormController';
import type { FormFieldValue } from '@aerogel/core/forms/FormController';
import type {
    FormControlEmits,
    FormControlExpose,
    FormControlProps,
} from '@aerogel/core/components/contracts/FormControl';

defineOptions({ inheritAttrs: false });

const {
    name,
    label,
    description,
    modelValue,
    class: rootClass,
} = defineProps<
    FormControlProps<T> & {
        class?: HTMLAttributes['class'];
        labelClass?: HTMLAttributes['class'];
        inputClass?: HTMLAttributes['class'];
        thumbClass?: HTMLAttributes['class'];
    }
>();
const $root = useTemplateRef<ComponentPublicInstance>('$rootRef');
const $control = ref<HTMLElement | null>(null);
const emit = defineEmits<FormControlEmits>();
const form = inject<FormController | null>('form', null);
const errors = computed(() => {
    if (!form || !name) {
        return null;
    }

    return form.errors[name] ?? null;
});

const expose = {
    $control,
    id: `switch-${uuid()}`,
    name: computed(() => name),
    label: computed(() => label),
    description: computed(() => description),
    value: computed(() => {
        if (form && name) {
            return form.getFieldValue(name) as T;
        }

        return modelValue as T;
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
    ...exposeElementMethods(() => $control.value),
} satisfies FormControlExpose<T, HTMLElement>;

defineExpose(expose);

watchEffect(() => ($control.value = $root.value?.$el ?? null));
watchEffect(() => {
    if (!description && !errors.value) {
        return;
    }

    // eslint-disable-next-line no-console
    console.warn('Errors and description not implemented in <HeadlessSwitch>');
});
</script>
