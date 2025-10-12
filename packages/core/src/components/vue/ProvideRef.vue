<template>
    <slot />
</template>

<script setup lang="ts">
import { provide } from 'vue';

const { name } = defineProps<{ name: string }>();
const model = defineModel<unknown>();

provide(name, model);
</script>
