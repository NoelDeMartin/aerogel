<template>
    <AGHeadlessButton
        class="flex items-center gap-1 font-semibold focus-visible:outline-2"
        :class="variantClasses"
        :disabled="disabled"
    >
        <slot />
    </AGHeadlessButton>
</template>

<script setup lang="ts">
import { Colors, booleanProp, enumProp, removeInteractiveClasses } from '@aerogel/core';
import { computed } from 'vue';

const props = defineProps({
    color: enumProp(Colors, Colors.Primary),
    small: booleanProp(),
    icon: booleanProp(),
    disabled: booleanProp(),
});

const colorClasses = computed(() => {
    const baseColoredStyles = 'shadow-2xs text-white focus-visible:outline-offset-2';

    switch (props.color) {
        case Colors.Danger:
            return `${baseColoredStyles} bg-red-600 hover:bg-red-500 focus-visible:outline-red-600`;
        case Colors.Clear:
            return 'text-gray-900 bg-white hover:bg-gray-100 focus-visible:outline-gray-900';
        case Colors.Secondary:
            return `${baseColoredStyles} bg-gray-600 hover:bg-gray-500 focus-visible:outline-gray-600`;
        default:
        case Colors.Primary:
            return `${baseColoredStyles} bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-indigo-600`;
    }
});

const roundClasses = computed(() => {
    if (props.icon) {
        return 'rounded-full';
    }

    if (props.small) {
        return 'rounded-xs';
    }

    return 'rounded-md';
});

const sizeClasses = computed(() => {
    if (props.icon) {
        const dimensionsClasses = props.small ? 'size-7' : 'size-clickable';

        return `${dimensionsClasses} flex items-center justify-center`;
    }

    if (props.small) {
        return 'px-2 py-1 text-xs';
    }

    return 'px-3.5 py-2.5 text-sm';
});

const variantClasses = computed(() => {
    const classes = `${colorClasses.value} ${sizeClasses.value} ${roundClasses.value}`;

    if (props.disabled) {
        return `${removeInteractiveClasses(classes)} opacity-50`;
    }

    return classes;
});
</script>
