<template>
    <p v-if="errorMessage" :id="`${input.id}-error`">
        {{ errorMessage }}
    </p>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { injectReactiveOrFail } from '@/utils/vue';
import { translate } from '@/utils/lang';

import type { IAGHeadlessInput } from './AGHeadlessInput';

const input = injectReactiveOrFail<IAGHeadlessInput>(
    'input',
    '<AGHeadlessInputError> must be a child of a <AGHeadlessInput>',
);
const errorMessage = computed(() => {
    if (!input.errors) {
        return null;
    }

    return translate(`errors.${input.errors[0]}`);
});
</script>
