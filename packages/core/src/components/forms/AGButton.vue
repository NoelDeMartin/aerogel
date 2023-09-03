<template>
    <AGHeadlessButton class="px-2.5 py-1.5 focus-visible:outline focus-visible:outline-2" :class="colorClasses">
        <slot />
    </AGHeadlessButton>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { booleanProp } from '@/utils';

import AGHeadlessButton from '../headless/forms/AGHeadlessButton.vue';

const props = defineProps({
    clear: booleanProp(),
    secondary: booleanProp(),
});

const colorClasses = computed(() => {
    if (props.secondary) {
        return 'text-white bg-gray-600 hover:bg-gray-500 focus-visible:outline-offset-2 focus-visible:outline-gray-600';
    }

    if (props.clear) {
        return 'hover:bg-gray-500/20 focus-visible:outline-gray-500/60';
    }

    return [
        'text-white bg-indigo-600',
        'hover:bg-indigo-500',
        'focus-visible:outline-offset-2 focus-visible:outline-indigo-600',
    ].join(' ');
});
</script>
