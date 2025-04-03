<template>
    <AGHeadlessButton :class="renderedClasses" v-bind="props">
        <slot />
    </AGHeadlessButton>
</template>

<script setup lang="ts">
import clsx from 'clsx';
import { computed } from 'vue';
import { cva } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

import type { IButtonProps } from '@aerogel/core/components/contracts/Button';

import AGHeadlessButton from '../headless/AGHeadlessButton.vue';

const { class: classes, size, variant, ...props } = defineProps<IButtonProps>();

const renderedClasses = computed(() => {
    /* eslint-disable vue/max-len */
    const variants = cva('px-2.5 py-1.5 focus-visible:outline focus-visible:outline-2', {
        variants: {
            variant: {
                default:
                    'text-white bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-offset-2 focus-visible:outline-indigo-600',
                destructive:
                    'text-white bg-red-600 hover:bg-red-500 focus-visible:outline-offset-2 focus-visible:outline-red-600',
                secondary:
                    'text-white bg-gray-600 hover:bg-gray-500 focus-visible:outline-offset-2 focus-visible:outline-gray-600',
                ghost: 'hover:bg-gray-500/20 focus-visible:outline-gray-500/60',
                link: 'font-medium hover:underline',
            },
            size: {
                default: '',
                sm: '',
                icon: '',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    });
    /* eslint-enable vue/max-len */

    return twMerge(clsx(variants({ variant, size }), classes));
});
</script>
