<template>
    <main :class="renderedRootClasses">
        <slot />
    </main>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { classes } from '@aerogel/core';
import type { HTMLAttributes } from 'vue';

const { class: rootClasses } = defineProps<{ class?: HTMLAttributes['class'] }>();

const renderedRootClasses = computed(() =>
    classes('mx-auto flex w-full max-w-screen-md grow flex-col px-4 py-8 md:px-0', rootClasses));
</script>
