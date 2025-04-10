<template>
    <SelectValue v-if="$slots.default" :placeholder="select.placeholder">
        <slot />
    </SelectValue>
    <SelectValue v-else :placeholder="select.placeholder" />
</template>

<script setup lang="ts">
import { SelectValue } from 'reka-ui';

import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import type { SelectExpose } from '@aerogel/core/components/contracts/Select';

const select = injectReactiveOrFail<SelectExpose>(
    'select',
    '<HeadlessSelectValue> must be a child of a <HeadlessSelect>',
);
</script>
