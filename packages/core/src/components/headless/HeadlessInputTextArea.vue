<template>
    <textarea
        :id="input.id"
        ref="$textArea"
        :name="name"
        :required="input.required ?? undefined"
        :value="value"
        :aria-invalid="input.errors ? 'true' : 'false'"
        :aria-describedby="
            input.errors ? `${input.id}-error` : input.description ? `${input.id}-description` : undefined
        "
        @input="update"
    />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { onFormFocus } from '@aerogel/core/components/utils';
import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import type { InputExpose } from '@aerogel/core/components/contracts/Input';

const $textArea = ref<HTMLTextAreaElement>();
const input = injectReactiveOrFail<InputExpose>(
    'input',
    '<HeadlessInputTextArea> must be a child of a <HeadlessInput>',
);
const name = computed(() => input.name ?? undefined);
const value = computed(() => input.value as string);

function update() {
    if (!$textArea.value) {
        return;
    }

    input.update($textArea.value.value);
}

onFormFocus(input, () => $textArea.value?.focus());
</script>
