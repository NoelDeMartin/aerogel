<template>
    <Label v-if="show" :for="select.id" v-bind="$props">
        <slot>
            {{ select.label }}
        </slot>
    </Label>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue';
import { Label } from 'reka-ui';
import type { LabelProps } from 'reka-ui';

import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import type { SelectExpose } from '@aerogel/core/components/contracts/Select';

defineProps<Omit<LabelProps, 'for'>>();

const select = injectReactiveOrFail<SelectExpose>(
    'select',
    '<HeadlessSelectLabel> must be a child of a <HeadlessSelect>',
);
const slots = useSlots();
const show = computed(() => !!(select.label || slots.default));
</script>
