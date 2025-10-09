<template>
    <details class="group">
        <summary :class="renderedSummaryClasses">
            <IconCheveronRight class="size-6 transition-transform group-open:rotate-90" />
            <slot name="label">
                <span>{{ label ?? $td('ui.details', 'Details') }}</span>
            </slot>
        </summary>

        <div :class="renderedContentClasses">
            <slot />
        </div>
    </details>
</template>

<script setup lang="ts">
import IconCheveronRight from '~icons/zondicons/cheveron-right';
import { classes } from '@aerogel/core/utils';
import { type HTMLAttributes, computed } from 'vue';

const {
    label = undefined,
    contentClass,
    summaryClass,
} = defineProps<{ label?: string; contentClass?: HTMLAttributes['class']; summaryClass?: HTMLAttributes['class'] }>();
const renderedContentClasses = computed(() => classes('pt-2 pl-4', contentClass));
const renderedSummaryClasses = computed(() =>
    classes(
        '-ml-2 flex w-[max-content] items-center rounded-lg py-2 pr-3 pl-1',
        'hover:bg-gray-100 focus-visible:outline focus-visible:outline-gray-700',
        summaryClass,
    ));
</script>
