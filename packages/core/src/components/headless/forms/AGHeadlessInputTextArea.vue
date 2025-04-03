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
import { computed, ref, watchEffect } from 'vue';

import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import type { IAGHeadlessInput } from '@aerogel/core/components/headless/forms/AGHeadlessInput';
import type { __SetsElement } from '@aerogel/core/components/contracts/shared';

import { onFormFocus } from './composition';

const $textArea = ref<HTMLTextAreaElement>();
const input = injectReactiveOrFail<IAGHeadlessInput>(
    'input',
    '<AGHeadlessInputTextArea> must be a child of a <AGHeadlessInput>',
);
const name = computed(() => input.name ?? undefined);
const value = computed(() => input.value as string);

function update() {
    if (!$textArea.value) {
        return;
    }

    input.update($textArea.value.value);
}

watchEffect(() => (input as unknown as __SetsElement).__setElement($textArea.value));
onFormFocus(input, () => $textArea.value?.focus());
</script>
