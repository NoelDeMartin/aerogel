<template>
    <input
        :id="input.id"
        ref="$input"
        :name
        :type
        :checked
        :required="input.required ?? undefined"
        :aria-invalid="input.errors ? 'true' : 'false'"
        :aria-describedby="
            input.errors ? `${input.id}-error` : input.description ? `${input.id}-description` : undefined
        "
        @input="update"
    >
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';

import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import { onFormFocus } from '@aerogel/core/utils/composition/forms';
import type { FormFieldValue } from '@aerogel/core/forms/FormController';
import type { InputExpose } from '@aerogel/core/components/contracts/Input';

const { type = 'text' } = defineProps<{ type?: string }>();
const $input = ref<HTMLInputElement>();
const input = injectReactiveOrFail<InputExpose>('input', '<HeadlessInputInput> must be a child of a <HeadlessInput>');
const name = computed(() => input.name ?? undefined);
const value = computed(() => input.value);
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

    if (type === 'date') {
        $input.value.valueAsDate = value.value as Date;

        return;
    }

    $input.value.value = (value.value as string) ?? null;
});
</script>
