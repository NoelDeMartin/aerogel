<template>
    <HeadlessButton :class="renderedClasses" :disabled v-bind="props">
        <slot />
    </HeadlessButton>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import HeadlessButton from '@aerogel/core/components/headless/HeadlessButton.vue';
import { variantClasses } from '@aerogel/core/utils/classes';
import type { ButtonProps } from '@aerogel/core/components/contracts/Button';
import type { Variants } from '@aerogel/core/utils/classes';

const { class: baseClasses, size, variant, disabled, ...props } = defineProps<ButtonProps>();

/* eslint-disable vue/max-len */
// prettier-ignore
const renderedClasses = computed(() => variantClasses<Variants<Pick<ButtonProps, 'size' | 'variant' | 'disabled'>>>(
    { baseClasses, variant, size, disabled },
    {
        baseClasses: 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        variants: {
            variant: {
                default: 'bg-primary-600 text-white focus-visible:outline-primary-600',
                secondary: 'bg-background text-gray-900 ring-gray-300',
                danger: 'bg-red-600 text-white focus-visible:outline-red-600',
                warning: 'bg-yellow-600 text-white focus-visible:outline-yellow-600',
                ghost: 'bg-transparent',
                outline: 'bg-transparent text-primary-600 ring-primary-600',
                link: 'text-links',
            },
            size: {
                small: 'text-xs min-h-6',
                default: 'text-sm min-h-8',
                large: 'text-base min-h-10',
                icon: 'rounded-full p-2.5',
            },
            disabled: {
                false: null,
                true: 'opacity-50 cursor-not-allowed',
            },
        },
        compoundVariants: [
            {
                variant: ['default', 'secondary', 'danger', 'ghost', 'outline'],
                class: 'flex items-center justify-center gap-1 font-medium',
            },
            {
                variant: ['default', 'danger'],
                class: 'shadow-sm',
            },
            {
                variant: ['secondary', 'outline'],
                class: 'ring-1 ring-inset',
            },
            {
                variant: ['default', 'secondary', 'danger', 'ghost', 'outline'],
                size: 'small',
                class: 'rounded px-2 py-1',
            },
            {
                variant: ['default', 'secondary', 'danger', 'ghost', 'outline'],
                size: 'default',
                class: 'rounded-md px-2.5 py-1.5',
            },
            {
                variant: ['default', 'secondary', 'danger', 'ghost', 'outline'],
                size: 'large',
                class: 'rounded-md px-3 py-2',
            },
            {
                variant: 'default',
                disabled: false,
                class: 'hover:bg-primary-500',
            },
            {
                variant: ['secondary', 'ghost', 'outline'],
                disabled: false,
                class: 'hover:bg-gray-50',
            },
            {
                variant: 'danger',
                disabled: false,
                class: 'hover:bg-red-500',
            },
            {
                variant: 'link',
                disabled: false,
                class: 'hover:underline',
            },
            {
                variant: 'link',
                size: 'small',
                class: 'leading-6',
            },
            {
                variant: 'link',
                size: 'default',
                class: 'leading-8',
            },
            {
                variant: 'link',
                size: 'large',
                class: 'leading-10',
            },
        ],
        defaultVariants: {
            variant: 'default',
            size: 'default',
            disabled: false,
        },
    },
));
/* eslint-enable vue/max-len */
</script>
