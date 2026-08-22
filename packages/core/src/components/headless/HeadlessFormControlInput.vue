<template>
    <input
        :id="formControl.id"
        ref="$controlRef"
        :name
        :checked
        :type="renderedType"
        :required="formControl.required ?? undefined"
        :aria-invalid="formControl.errors ? 'true' : 'false'"
        :aria-describedby="
            formControl.errors
                ? `${formControl.id}-error`
                : formControl.description
                    ? `${formControl.id}-description`
                    : undefined
        "
        @input="update"
    >
</template>

<script setup lang="ts">
import { computed, inject, useTemplateRef, watchEffect } from 'vue';

import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import { onFormFocus } from '@aerogel/core/utils/composition/forms';
import { getLocalTimezoneOffset } from '@aerogel/core/utils';
import type FormController from '@aerogel/core/forms/FormController';
import type { FormFieldValue } from '@aerogel/core/forms/FormController';
import type { FormControlExpose } from '@aerogel/core/components/contracts/FormControl';

const { type } = defineProps<{ type?: string }>();
const $control = useTemplateRef('$controlRef');
const formControl = injectReactiveOrFail<FormControlExpose>(
    'form-control',
    '<HeadlessFormControlInput> must be a child of a <HeadlessFormControl>',
);
const form = inject<FormController | null>('form', null);
const name = computed(() => formControl.name ?? undefined);
const value = computed(() => formControl.value);
const renderedType = computed(() => {
    if (type) {
        return type;
    }

    const fieldType = (name.value && form?.getFieldType(name.value)) ?? '';

    return ['text', 'email', 'number', 'tel', 'url'].includes(fieldType) ? fieldType : 'text';
});
const checked = computed(() => {
    if (renderedType.value !== 'checkbox') {
        return;
    }

    return !!value.value;
});

function update() {
    if (!$control.value) {
        return;
    }

    formControl.update(getValue());
}

function getValue(): FormFieldValue | null {
    if (!$control.value) {
        return null;
    }

    switch (renderedType.value) {
        case 'checkbox':
            return $control.value.checked;
        case 'date':
        case 'time':
        case 'datetime-local': {
            const date = new Date(
                Math.round($control.value.valueAsNumber / 60000) * 60000 +
                    getLocalTimezoneOffset($control.value.valueAsDate ?? new Date($control.value.valueAsNumber)),
            );

            if (isNaN(date.getTime())) {
                return null;
            }

            return date;
        }

        case 'number':
            return $control.value.valueAsNumber;
        default:
            return $control.value.value;
    }
}

onFormFocus(formControl, () => $control.value?.focus());
watchEffect(() => {
    formControl.$control = $control.value ?? null;

    if (!$control.value) {
        return;
    }

    if (['date', 'time', 'datetime-local'].includes(renderedType.value) && value.value instanceof Date) {
        const roundedValue = Math.round(value.value.getTime() / 60000) * 60000;

        $control.value.valueAsNumber = roundedValue - getLocalTimezoneOffset(value.value);

        if (value.value.getTime() !== roundedValue) {
            formControl.update(new Date(roundedValue));
        }

        return;
    }

    $control.value.value = (value.value as string) ?? null;
});

defineExpose({
    $el: $control,
    focus() {
        $control.value?.focus();
    },
    blur() {
        $control.value?.blur();
    },
});
</script>
