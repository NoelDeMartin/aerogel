<template>
    <HeadlessSwitch
        class="flex flex-row items-center gap-1"
        input-class="disabled:opacity-50 disabled:cursor-not-allowed data-[state=checked]:bg-primary-600 data-[state=unchecked]:bg-gray-200 relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focusdisabled:opacity-50 disabled:cursor-not-allowed :ring-2 focus:ring-primary-600 focus:ring-offset-2 focus:outline-hidden"
        thumb-class="data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0 pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out"
    />
</template>

<script setup lang="ts">
import HeadlessSwitch from '@aerogel/core/components/headless/HeadlessSwitch.vue';
</script>
