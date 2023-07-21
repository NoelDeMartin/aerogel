<template>
    <div class="flex gap-4">
        <div class="flex flex-col items-center rounded-lg border border-dashed border-gray-700 bg-gray-50 p-4">
            <component :is="headingTag" class="mb-2 mt-0">
                Default
            </component>
            <slot />
        </div>
        <div
            v-if="$slots.hover"
            class="flex flex-col items-center rounded-lg border border-dashed border-gray-700 bg-gray-50 p-4"
        >
            <component :is="headingTag" class="mb-2 mt-0">
                Hover
            </component>
            <slot name="hover" />
        </div>
        <div
            v-if="$slots.focus"
            class="flex flex-col items-center rounded-lg border border-dashed border-gray-700 bg-gray-50 p-4"
        >
            <component :is="headingTag" class="mb-2 mt-0">
                Focus
            </component>
            <slot name="focus" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { stringProp } from '@aerogel/core';
import { computed } from 'vue';

const props = defineProps({
    level: stringProp('2'),
});

const headingTag = computed(() => `h${props.level}`);
</script>
