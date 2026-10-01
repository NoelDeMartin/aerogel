<template>
    <Label v-if="show" :for="select.id" v-bind="$props">
        <slot>
            {{ select.label }}
        </slot>
    </Label>
</template>

<script setup lang="ts">
import type { SelectExpose } from '@aerogel/core/components/contracts/Select';
import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import { Label } from 'reka-ui';
import type { LabelProps } from 'reka-ui';
import { computed, useSlots } from 'vue';

defineProps<Omit<LabelProps, 'for'>>();

const select = injectReactiveOrFail<SelectExpose>(
    'select',
    '<HeadlessSelectLabel> must be a child of a <HeadlessSelect>',
);
const slots = useSlots();
const show = computed(() => !!(select.label || slots.default));
</script>
