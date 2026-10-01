<template>
    <p v-if="errorMessage" :id="`${select.id}-error`">
        {{ errorMessage }}
    </p>
</template>

<script setup lang="ts">
import type { SelectExpose } from '@aerogel/core/components/contracts/Select';
import { translateWithDefault } from '@aerogel/core/lang/utils';
import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import { computed } from 'vue';

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
