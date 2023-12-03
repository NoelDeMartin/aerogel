<template>
    <label v-if="show" :for="input.id">
        <slot>
            {{ input.label }}
        </slot>
    </label>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue';

import { injectReactiveOrFail } from '@/utils/vue';

import type { IAGHeadlessInput } from './AGHeadlessInput';

const input = injectReactiveOrFail<IAGHeadlessInput>(
    'input',
    '<AGHeadlessInputLabel> must be a child of a <AGHeadlessInput>',
);
const slots = useSlots();
const show = computed(() => !!(input.label || slots.default));
</script>
