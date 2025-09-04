<template>
    <Details :label="$td('ui.advancedOptions', 'Advanced options')">
        <slot />
    </Details>
</template>

<script setup lang="ts">
import Details from './Details.vue';
</script>
