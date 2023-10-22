<template>
    <AGHeadlessButton class="px-2.5 py-1.5 focus-visible:outline focus-visible:outline-2" :class="colorClasses">
        <slot />
    </AGHeadlessButton>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { enumProp } from '@/utils/vue';
import { Colors } from '@/components/constants';

import AGHeadlessButton from '../headless/forms/AGHeadlessButton.vue';

const props = defineProps({
    color: enumProp(Colors, Colors.Primary),
});

const colorClasses = computed(() => {
    switch (props.color) {
        case Colors.Secondary:
            return [
                'text-white bg-gray-600',
                'hover:bg-gray-500',
                'focus-visible:outline-offset-2 focus-visible:outline-gray-600',
            ].join(' ');
        case Colors.Clear:
            return 'hover:bg-gray-500/20 focus-visible:outline-gray-500/60';
        case Colors.Danger:
            return [
                'text-white bg-red-600',
                'hover:bg-red-500',
                'focus-visible:outline-offset-2 focus-visible:outline-red-600',
            ].join(' ');
        case Colors.Primary:
        default:
            return [
                'text-white bg-indigo-600',
                'hover:bg-indigo-500',
                'focus-visible:outline-offset-2 focus-visible:outline-indigo-600',
            ].join(' ');
    }
});
</script>
