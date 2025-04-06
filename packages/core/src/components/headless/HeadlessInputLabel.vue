<template>
    <label v-if="show" :for="input.id">
        <slot>
            {{ input.label }}
        </slot>
    </label>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue';

import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import type { InputExpose } from '@aerogel/core/components/contracts/Input';

const input = injectReactiveOrFail<InputExpose>('input', '<HeadlessInputLabel> must be a child of a <HeadlessInput>');
const slots = useSlots();
const show = computed(() => !!(input.label || slots.default));
</script>
