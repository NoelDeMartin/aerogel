<template>
    <details class="group">
        <summary
            class="-ml-2 flex w-[max-content] items-center rounded-lg py-2 pr-3 pl-1 hover:bg-gray-100 focus-visible:outline focus-visible:outline-gray-700"
        >
            <IconCheveronRight class="size-6 transition-transform group-open:rotate-90" />
            <span>{{ label }}</span>
        </summary>

        <div :class="renderedContentClasses">
            <slot />
        </div>
    </details>
</template>

<script setup lang="ts">
import { classes } from '@aerogel/core/utils';
import { type HTMLAttributes, computed } from 'vue';
import IconCheveronRight from '~icons/zondicons/cheveron-right';

const { label, contentClass } = defineProps<{ label: string; contentClass?: HTMLAttributes['class'] }>();
const renderedContentClasses = computed(() => classes('pt-2 pl-4', contentClass));
</script>
