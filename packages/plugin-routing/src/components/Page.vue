<template>
    <main :class="renderedRootClasses">
        <PageTitle v-if="title">
            {{ title }}
        </PageTitle>
        <slot />
    </main>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { classes } from '@aerogel/core';
import type { HTMLAttributes } from 'vue';

const { class: rootClasses, fullbleed } = defineProps<{
    class?: HTMLAttributes['class'];
    title?: string;
    fullbleed?: boolean;
}>();

const renderedRootClasses = computed(() =>
    classes('mx-auto flex w-full grow flex-col px-edge py-8', fullbleed || 'max-w-screen-content', rootClasses));
</script>
