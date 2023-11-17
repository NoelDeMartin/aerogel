<template>
    <ListboxButton v-slot="{ value, open, disabled }: ComponentProps">
        <slot :value="value" :open="open" :disabled="disabled">
            <span :class="textClass">{{ select?.buttonText }}</span>
        </slot>
        <slot name="icon" />
    </ListboxButton>
</template>

<script setup lang="ts">
import { ListboxButton } from '@headlessui/vue';

import { injectReactiveOrFail, stringProp } from '@/utils/vue';
import type { ComponentProps } from '@/utils/vue';

import type { IAGHeadlessSelect } from './AGHeadlessSelect';

defineProps({ textClass: stringProp() });

const select = injectReactiveOrFail<IAGHeadlessSelect>(
    'select',
    '<AGHeadlessSelectButton> must be a child of a <AGHeadlessSelect>',
);
</script>
