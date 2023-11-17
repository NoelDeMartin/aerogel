<template>
    <p v-if="errorMessage" :id="`${select.id}-error`">
        {{ errorMessage }}
    </p>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { injectReactiveOrFail } from '@/utils/vue';
import { translateWithDefault } from '@/lang/utils';

import type { IAGHeadlessSelect } from './AGHeadlessSelect';

const select = injectReactiveOrFail<IAGHeadlessSelect>(
    'select',
    '<AGHeadlessSelectError> must be a child of a <AGHeadlessSelect>',
);
const errorMessage = computed(() => {
    if (!select.errors) {
        return null;
    }

    return translateWithDefault(`errors.${select.errors[0]}`, `Error: ${select.errors[0]}`);
});
</script>
