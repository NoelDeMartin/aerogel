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
    if (type !== 'checkbox') {
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

    switch (type) {
        case 'checkbox':
            return $input.value.checked;
        case 'date':
            return $input.value.valueAsDate;
        default:
            return $input.value.value;
    }
}

onFormFocus(input, () => $input.value?.focus());
watchEffect(() => {
    if (!$input.value) {
        return;
    }

    if (type === 'date' && value.value instanceof Date) {
        $input.value.valueAsDate = value.value;

        return;
    }

    $input.value.value = (value.value as string) ?? null;
});
</script>
