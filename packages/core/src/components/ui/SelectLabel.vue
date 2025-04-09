<template>
    <HeadlessSelectLabel v-if="$slots.default" class="block text-sm leading-6 font-medium text-gray-900">
        <slot />
    </HeadlessSelectLabel>
    <HeadlessSelectLabel v-else class="block text-sm leading-6 font-medium text-gray-900" />
</template>

<script setup lang="ts">
import HeadlessSelectLabel from '@aerogel/core/components/headless/HeadlessSelectLabel.vue';
</script>
