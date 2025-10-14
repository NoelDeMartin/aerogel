<template>
    <slot />
</template>

<script setup lang="ts">
import { provide } from 'vue';

const { name, value } = defineProps<{ name: string; value: unknown }>();

provide(name, value);
</script>
