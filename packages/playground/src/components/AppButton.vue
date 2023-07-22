<template>
    <AGHeadlessButton
        class="font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        :class="variantClasses"
    >
        <slot />
    </AGHeadlessButton>
</template>

<script setup lang="ts">
import { booleanProp, enumProp } from '@aerogel/core';

import { Colors } from '@/components';
import { computed } from 'vue';

const props = defineProps({
    color: enumProp(Colors, Colors.Primary),
    small: booleanProp(),
});

const colorClasses = computed(() => {
    switch (props.color) {
        case Colors.Danger:
            return 'bg-red-600 hover:bg-red-500 focus-visible:outline-red-600';
        default:
        case Colors.Primary:
            return 'bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-indigo-600';
    }
});

const sizeClasses = computed(() => {
    if (props.small) {
        return 'rounded px-2 py-1 text-xs';
    }

    return 'rounded-md px-3.5 py-2.5 text-sm';
});

const variantClasses = computed(() => `${colorClasses.value} ${sizeClasses.value}`);
</script>
