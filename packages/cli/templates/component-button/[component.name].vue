<template>
    <AGHeadlessButton :class="colorClasses">
        <slot />
    </AGHeadlessButton>
</template>

<script setup lang="ts">
import { Colors, enumProp } from '@aerogel/core';
import { computed } from 'vue';

const props = defineProps({
    color: enumProp(Colors, Colors.Primary),
});

const colorClasses = computed(() => {
    switch (props.color) {
        case Colors.Secondary:
            // Add your custom color classes here.
            return '';
        case Colors.Clear:
            // Add your custom color classes here.
            return '';
        case Colors.Danger:
            // Add your custom color classes here.
            return '';
        case Colors.Primary:
        default:
            // Add your custom color classes here.
            return '';
    }
});
</script>
