<template>
    <HeadlessSelectTrigger :class="renderedClasses">
        <HeadlessSelectValue class="col-start-1 row-start-1 truncate pr-6" />
        <IconCheveronDown class="col-start-1 row-start-1 size-5 self-center justify-self-end text-gray-500 sm:size-4" />
        <div v-if="select?.errors" class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <IconExclamationSolid class="size-5 text-red-500" />
        </div>
    </HeadlessSelectTrigger>
</template>

<script setup lang="ts">
import IconCheveronDown from '~icons/zondicons/cheveron-down';
import IconExclamationSolid from '~icons/zondicons/exclamation-solid';

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
        'relative grid w-full cursor-default grid-cols-1 rounded-md bg-white py-1.5 pr-2 pl-3 text-left text-gray-900 outline-1 -outline-offset-1',
        'focus:outline-2 focus:-outline-offset-2 sm:text-sm/6',
        {
            'mt-1': select.label,
            'outline-gray-300 focus:outline-primary-600 data-[state=open]:outline-primary-600': !select.errors,
            'text-gray-900 shadow-2xs ring-gray-900/10 placeholder:text-gray-400': !select.errors,
            'outline-red-900/10 pr-10 text-red-900 placeholder:text-red-300': select.errors,
            'focus:outline-red-500 data-[state=open]:outline-red-500': select.errors,
        },
        rootClasses,
    ));
</script>
