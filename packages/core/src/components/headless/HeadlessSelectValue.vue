<template>
    <SelectValue v-if="$slots.default" :placeholder="select.placeholder">
        <slot />
    </SelectValue>
    <SelectValue v-else :placeholder="select.placeholder" />
</template>

<script setup lang="ts">
import type { SelectExpose } from '@aerogel/core/components/contracts/Select';
import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import { SelectValue } from 'reka-ui';

const select = injectReactiveOrFail<SelectExpose>(
    'select',
    '<HeadlessSelectValue> must be a child of a <HeadlessSelect>',
);
</script>
