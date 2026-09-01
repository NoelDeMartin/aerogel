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

const { class: rootClasses } = defineProps<{ class?: HTMLAttributes['class']; title?: string }>();

const renderedRootClasses = computed(() =>
    classes('mx-auto flex w-full max-w-screen-content grow flex-col px-edge py-8', rootClasses));
</script>
