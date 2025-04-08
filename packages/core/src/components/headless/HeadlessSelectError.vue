<template>
    <p v-if="errorMessage" :id="`${select.id}-error`">
        {{ errorMessage }}
    </p>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import { translateWithDefault } from '@aerogel/core/lang/utils';
import type { SelectExpose } from '@aerogel/core/components/contracts/Select';

const select = injectReactiveOrFail<SelectExpose>(
    'select',
    '<HeadlessSelectError> must be a child of a <HeadlessSelect>',
);
const errorMessage = computed(() => {
    if (!select.errors) {
        return null;
    }

    return translateWithDefault(`errors.${select.errors[0]}`, `Error: ${select.errors[0]}`);
});
</script>
