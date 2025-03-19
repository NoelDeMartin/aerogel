<template>
    <AGHeadlessButton ref="$button" :class="renderedClasses" v-bind="baseProps">
        <slot />
    </AGHeadlessButton>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { twMerge } from 'tailwind-merge';

import { stringProp } from '@/utils/vue';
import { Colors } from '@/components/constants';
import { removeInteractiveClasses } from '@/utils/tailwindcss';
import { buttonExpose, buttonProps, extractButtonProps } from '@/components/headless/forms/AGHeadlessButton';
import type { IAGHeadlessButton } from '@/components/headless/forms/AGHeadlessButton';

import AGHeadlessButton from '../headless/forms/AGHeadlessButton.vue';

const props = defineProps({
    ...buttonProps(),
    class: stringProp(''),
});

const baseProps = extractButtonProps(props);
const $button = ref<IAGHeadlessButton>();
const baseClasses =
    'clickable-target flex items-center justify-center rounded-lg px-3 py-2 whitespace-nowrap focus-visible:outline';
const colorClasses = computed(() => {
    switch (props.color) {
        case Colors.Secondary:
            return 'ring-1 ring-inset ring-gray-300 hover:bg-gray-50';
        case Colors.Clear:
            return 'hover:bg-gray-100 focus-visible:outline-gray-700';
        case Colors.Danger:
            return [
                'bg-red-600 text-white shadow-sm',
                'hover:bg-red-500',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600',
            ].join(' ');
        case Colors.Primary:
        default:
            return [
                'bg-[--primary-600] text-white shadow-sm',
                'hover:bg-[--primary-500]',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--primary-600]',
            ].join(' ');
    }
});
const variantClasses = computed(() => {
    const classes = `${colorClasses.value} ${baseClasses}`;

    if (!props.disabled) {
        return classes;
    }

    return `${removeInteractiveClasses(classes)} opacity-50`;
});
const renderedClasses = computed(() => twMerge(variantClasses.value, props.class));

defineExpose(buttonExpose($button));
</script>
