<template>
    <ListboxLabel v-if="show" v-slot="{ open, disabled }: ComponentProps">
        <slot :open="open" :disabled="disabled">
            {{ select.label }}
        </slot>
    </ListboxLabel>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue';
import { ListboxLabel } from '@headlessui/vue';

import { injectReactiveOrFail } from '@/utils/vue';
import type { ComponentProps } from '@/utils/vue';

import type { IAGHeadlessSelect } from './AGHeadlessSelect';

const select = injectReactiveOrFail<IAGHeadlessSelect>(
    'select',
    '<AGHeadlessSelectLabel> must be a child of a <AGHeadlessSelect>',
);
const slots = useSlots();
const show = computed(() => !!(select.label || slots.default));
</script>
