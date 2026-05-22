<template>
    <div class="mt-4 flex" :class="{ 'flex-col': layout === 'vertical', 'pl-4': titleHeadingLevel === 4 }">
        <div class="grow">
            <component :is="titleTag" :id="titleId" :class="titleClasses">
                {{ title }}
            </component>
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

const { layout = 'horizontal', class: rootClass, titleHeadingLevel = 3 } = defineProps<{
    title: string;
    titleId?: string;
    titleHeadingLevel?: 3 | 4;
    description?: string;
    class?: HTMLAttributes['class'];
    layout?: 'vertical' | 'horizontal';
}>();
const renderedRootClass = computed(() => classes(rootClass, 'flex flex-col justify-center gap-1'));
const titleTag = computed(() => `h${titleHeadingLevel}`);
const titleClasses = computed(() => {
    return titleHeadingLevel === 4 ? 'text-sm font-semibold text-gray-700' : 'text-base font-semibold';
});
</script>
