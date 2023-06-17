<template>
    <AGHeadlessButton
        class="bg-indigo-600 px-2.5 py-1.5 text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    >
        <slot />
    </AGHeadlessButton>
</template>

<script setup lang="ts">
import AGHeadlessButton from '../headless/forms/AGHeadlessButton.vue';
</script>
