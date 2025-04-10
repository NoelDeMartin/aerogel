<template>
    <HeadlessSelectTrigger :class="renderedClasses">
        <HeadlessSelectValue class="col-start-1 row-start-1 truncate pr-6" />
        <IconCheveronDown class="col-start-1 row-start-1 size-5 self-center justify-self-end text-gray-500 sm:size-4" />
    </HeadlessSelectTrigger>
</template>

<script setup lang="ts">
import IconCheveronDown from '~icons/zondicons/cheveron-down';

import { computed } from 'vue';
import type { HTMLAttributes } from 'vue';

import HeadlessSelectTrigger from '@aerogel/core/components/headless/HeadlessSelectTrigger.vue';
import HeadlessSelectValue from '@aerogel/core/components/headless/HeadlessSelectValue.vue';
import { injectReactiveOrFail } from '@aerogel/core/utils';
import { classes } from '@aerogel/core/utils/classes';
import type { SelectExpose } from '@aerogel/core/components/contracts/Select';

const { class: rootClasses } = defineProps<{ class?: HTMLAttributes['class'] }>();
const select = injectReactiveOrFail<SelectExpose>('select', '<SelectTrigger> must be a child of a <Select>');
const renderedClasses = computed(() =>
    classes(
        // eslint-disable-next-line vue/max-len
        'focus:outline-primary grid w-full cursor-default grid-cols-1 rounded-md bg-white py-1.5 pr-2 pl-3 text-left text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 sm:text-sm/6',
        { 'mt-1': select.label },
        rootClasses,
    ));
</script>
