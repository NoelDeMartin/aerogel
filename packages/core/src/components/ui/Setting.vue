<template>
    <div class="mt-4 flex" :class="{ 'flex-col': layout === 'vertical' }">
        <div class="flex-grow">
            <h3 :id="titleId" class="text-base font-semibold">
                {{ title }}
            </h3>
            <Markdown v-if="description" :text="description" class="mt-1 text-sm text-gray-500" />
        </div>

        <div :class="renderedRootClass">
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { HTMLAttributes } from 'vue';

import Markdown from '@aerogel/core/components/ui/Markdown.vue';
import { classes } from '@aerogel/core/utils';

const { layout = 'horizontal', class: rootClass } = defineProps<{
    title: string;
    titleId?: string;
    description?: string;
    class?: HTMLAttributes['class'];
    layout?: 'vertical' | 'horizontal';
}>();
const renderedRootClass = computed(() => classes(rootClass, 'flex flex-col justify-center gap-1'));
</script>
