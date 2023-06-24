<template>
    <p v-if="errorMessage" :id="`${input.id}-error`">
        {{ errorMessage }}
    </p>
</template>

<script setup lang="ts">
import { injectReactiveOrFail } from '@/utils';

import type { IAGHeadlessInput } from './AGHeadlessInput';
import { computed } from 'vue';
import { lang } from '@/lang';

const input = injectReactiveOrFail<IAGHeadlessInput>('input');
const errorMessage = computed(() => {
    if (!input.errors) {
        return null;
    }

    return lang(`errors.${input.errors[0]}`);
});
</script>
