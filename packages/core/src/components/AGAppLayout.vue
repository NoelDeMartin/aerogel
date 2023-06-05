<template>
    <div class="flex h-full flex-col text-base font-normal leading-tight text-gray-900 antialiased">
        <slot />

        <AGAppOverlays />
    </div>
</template>

<script setup lang="ts">
import AGAppOverlays from './AGAppOverlays.vue';
</script>
