<template>
    <p v-if="errorMessage" :id="`${input.id}-error`">
        {{ errorMessage }}
    </p>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import { translateWithDefault } from '@aerogel/core/lang/utils';
import type { InputExpose } from '@aerogel/core/components/contracts/Input';

const input = injectReactiveOrFail<InputExpose>('input', '<HeadlessInputError> must be a child of a <HeadlessInput>');
const errorMessage = computed(() => {
    if (!input.errors) {
        return null;
    }

    return translateWithDefault(`errors.${input.errors[0]}`, `Error: ${input.errors[0]}`);
});
</script>
