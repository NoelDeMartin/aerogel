<template>
    <input
        :id="input.id"
        ref="$inputRef"
        :name
        :checked
        :type="renderedType"
        :required="input.required ?? undefined"
        :aria-invalid="input.errors ? 'true' : 'false'"
        :aria-describedby="
            input.errors ? `${input.id}-error` : input.description ? `${input.id}-description` : undefined
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
import type { InputExpose } from '@aerogel/core/components/contracts/Input';

const { type } = defineProps<{ type?: string }>();
const $input = useTemplateRef('$inputRef');
const input = injectReactiveOrFail<InputExpose>('input', '<HeadlessInputInput> must be a child of a <HeadlessInput>');
const form = inject<FormController | null>('form', null);
const name = computed(() => input.name ?? undefined);
const value = computed(() => input.value);
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
    if (!$input.value) {
        return;
    }

    input.update(getValue());
}

function getValue(): FormFieldValue | null {
    if (!$input.value) {
        return null;
    }

    switch (renderedType.value) {
        case 'checkbox':
            return $input.value.checked;
        case 'date':
        case 'time':
        case 'datetime-local':
            return new Date(
                Math.round($input.value.valueAsNumber / 60000) * 60000 +
                    getLocalTimezoneOffset($input.value.valueAsDate ?? new Date($input.value.valueAsNumber)),
            );
        case 'number':
            return $input.value.valueAsNumber;
        default:
            return $input.value.value;
    }
}

onFormFocus(input, () => $input.value?.focus());
watchEffect(() => {
    if (!$input.value) {
        return;
    }

    if (['date', 'time', 'datetime-local'].includes(renderedType.value) && value.value instanceof Date) {
        const roundedValue = Math.round(value.value.getTime() / 60000) * 60000;

        $input.value.valueAsNumber = roundedValue - getLocalTimezoneOffset(value.value);

        if (value.value.getTime() !== roundedValue) {
            input.update(new Date(roundedValue));
        }

        return;
    }

    $input.value.value = (value.value as string) ?? null;
});
</script>
