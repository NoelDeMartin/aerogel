<template>
    <Label v-if="show" :for="combobox.id" v-bind="$props">
        <slot>
            {{ combobox.label }}
        </slot>
    </Label>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue';
import { Label } from 'reka-ui';
import type { LabelProps } from 'reka-ui';

import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import type { ComboboxExpose } from '@aerogel/core/components/contracts/Combobox';

defineProps<Omit<LabelProps, 'for'>>();

const combobox = injectReactiveOrFail<ComboboxExpose>(
    'combobox',
    '<HeadlessComboboxLabel> must be a child of a <HeadlessCombobox>',
);
const slots = useSlots();
const show = computed(() => !!(combobox.label || slots.default));
</script>
