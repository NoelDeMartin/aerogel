<template>
    <HeadlessButton :class="renderedClasses" :disabled v-bind="props">
        <slot />
    </HeadlessButton>
</template>

<script setup lang="ts">
import HeadlessButton from '@aerogel/core/components/headless/HeadlessButton.vue';
import { computedVariantClasses } from '@aerogel/core/components/utils';
import type { ButtonProps } from '@aerogel/core/components/contracts/Button';
import type { Variants } from '@aerogel/core/components/utils';

const { class: baseClasses, size, variant, disabled, ...props } = defineProps<ButtonProps>();

/* eslint-disable vue/max-len */
// prettier-ignore
const renderedClasses = computedVariantClasses<Variants<Pick<ButtonProps, 'size' | 'variant' | 'disabled'>>>(
    { baseClasses, variant, size, disabled },
    {
        baseClasses: 'flex items-center justify-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        variants: {
            variant: {
                default: 'bg-primary text-white focus-visible:outline-primary',
                secondary: 'bg-background text-gray-900 ring-gray-300',
                danger: 'bg-danger text-white focus-visible:outline-danger',
                ghost: 'bg-transparent',
                outline: 'bg-transparent text-primary ring-primary',
                link: 'text-primary',
            },
            size: {
                small: 'text-xs',
                default: 'text-sm',
                large: 'text-base',
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
                class: 'font-medium',
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
                class: 'hover:bg-primary/90',
            },
            {
                variant: ['secondary', 'ghost', 'outline'],
                disabled: false,
                class: 'hover:bg-accent',
            },
            {
                variant: 'danger',
                disabled: false,
                class: 'hover:bg-danger/80',
            },
            {
                variant: 'link',
                disabled: false,
                class: 'hover:underline',
            },
        ],
        defaultVariants: {
            variant: 'default',
            size: 'default',
            disabled: false,
        },
    },
);
/* eslint-enable vue/max-len */
</script>
