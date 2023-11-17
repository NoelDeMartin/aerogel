<template>
    <ListboxLabel v-if="select.label" v-slot="{ open, disabled }: ComponentProps">
        <slot :open="open" :disabled="disabled">
            {{ select.label }}
        </slot>
    </ListboxLabel>
</template>

<script setup lang="ts">
import { ListboxLabel } from '@headlessui/vue';

import { injectReactiveOrFail } from '@/utils/vue';
import type { ComponentProps } from '@/utils/vue';

import type { IAGHeadlessSelect } from './AGHeadlessSelect';

const select = injectReactiveOrFail<IAGHeadlessSelect>(
    'select',
    '<AGHeadlessSelectLabel> must be a child of a <AGHeadlessSelect>',
);
</script>
