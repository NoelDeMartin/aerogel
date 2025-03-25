<template>
    <p v-if="errorMessage" :id="`${input.id}-error`">
        {{ errorMessage }}
    </p>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import { translateWithDefault } from '@aerogel/core/lang/utils';

import type { IAGHeadlessInput } from './AGHeadlessInput';

const input = injectReactiveOrFail<IAGHeadlessInput>(
    'input',
    '<AGHeadlessInputError> must be a child of a <AGHeadlessInput>',
);
const errorMessage = computed(() => {
    if (!input.errors) {
        return null;
    }

    return translateWithDefault(`errors.${input.errors[0]}`, `Error: ${input.errors[0]}`);
});
</script>
