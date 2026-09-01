<template>
    <h1 :class="renderedClasses">
        <slot />
    </h1>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { classes } from '@aerogel/core';
import type { HTMLAttributes } from 'vue';

const { class: rootClasses } = defineProps<{ class?: HTMLAttributes['class'] }>();
const renderedClasses = computed(() => classes('text-page-title text-slate-900', rootClasses));
</script>
