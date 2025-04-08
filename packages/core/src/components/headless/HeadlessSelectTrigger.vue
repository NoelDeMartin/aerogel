<template>
    <SelectTrigger :id="select.id">
        <slot>
            <HeadlessSelectValue :placeholder="select.placeholder" />
            <SelectIcon />
        </slot>
    </SelectTrigger>
</template>

<script setup lang="ts">
import { SelectIcon, SelectTrigger } from 'reka-ui';

import { injectReactiveOrFail } from '@aerogel/core/utils';
import type { SelectExpose } from '@aerogel/core/components/contracts/Select';

import HeadlessSelectValue from './HeadlessSelectValue.vue';

const select = injectReactiveOrFail<SelectExpose>(
    'select',
    '<HeadlessSelectTrigger> must be a child of a <HeadlessSelect>',
);
</script>
