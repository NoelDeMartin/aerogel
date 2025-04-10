<template>
    <HeadlessSelectLabel v-if="$slots.default" :class="renderedClasses">
        <slot />
    </HeadlessSelectLabel>
    <HeadlessSelectLabel v-else :class="renderedClasses" />
</template>

<script setup lang="ts">
import { computed } from 'vue';

import HeadlessSelectLabel from '@aerogel/core/components/headless/HeadlessSelectLabel.vue';
import { classes, injectReactiveOrFail } from '@aerogel/core/utils';
import type { SelectExpose } from '@aerogel/core/components/contracts/Select';

const select = injectReactiveOrFail<SelectExpose>('select', '<SelectLabel> must be a child of a <Select>');
const renderedClasses = computed(() => classes('block text-sm leading-6 font-medium text-gray-900', select.labelClass));
</script>
