<template>
    <HeadlessComboboxLabel v-if="$slots.default" :class="renderedClasses" v-bind="$props">
        <slot />
    </HeadlessComboboxLabel>
    <HeadlessComboboxLabel v-else :class="renderedClasses" v-bind="$props" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { LabelProps } from 'reka-ui';

import { classes } from '@aerogel/core/utils';
import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import type { SelectExpose } from '@aerogel/core/components/contracts/Select';

import HeadlessComboboxLabel from '../headless/HeadlessComboboxLabel.vue';

defineProps<Omit<LabelProps, 'for'>>();

const select = injectReactiveOrFail<SelectExpose>('select', '<ComboboxLabel> must be a child of a <Combobox>');
const renderedClasses = computed(() => classes('block text-sm leading-6 font-medium text-gray-900', select.labelClass));
</script>
