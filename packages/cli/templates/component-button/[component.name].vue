<template>
    <AGHeadlessButton :class="variantClasses" :disabled="disabled">
        <slot />
    </AGHeadlessButton>
</template>

<script setup lang="ts">
import { Colors, booleanProp, enumProp, removeInteractiveClasses } from '@aerogel/core';
import { computed } from 'vue';

const props = defineProps({
    color: enumProp(Colors, Colors.Primary),
    disabled: booleanProp(),
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

const variantClasses = computed(() => {
    if (props.disabled) {
        // Add additional classes for disabled state here.
        return removeInteractiveClasses(colorClasses.value);
    }

    return colorClasses.value;
});
</script>
