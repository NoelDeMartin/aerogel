<template>
    <AGHeadlessButton :class="renderedClasses" v-bind="props">
        <slot />
    </AGHeadlessButton>
</template>

<script setup lang="ts">
import { computedVariantClasses } from '@aerogel/core/components/utils';
import type { IButtonProps } from '@aerogel/core/components/contracts/Button';
import type { Variants } from '@aerogel/core/components/utils';

import AGHeadlessButton from '../headless/AGHeadlessButton.vue';

const { class: baseClasses, size, variant, ...props } = defineProps<IButtonProps>();

/* eslint-disable vue/max-len */
// prettier-ignore
const renderedClasses = computedVariantClasses<Variants<Pick<IButtonProps, 'size' | 'variant'>>>(
    { baseClasses, variant, size },
    {
        baseClasses: 'cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        variants: {
            variant: {
                default: 'bg-primary text-white hover:bg-primary/90 focus-visible:outline-primary',
                secondary: 'bg-background text-gray-900 ring-gray-300 hover:bg-accent',
                danger: 'bg-danger text-white hover:bg-danger/80 focus-visible:outline-danger',
                ghost: 'bg-background hover:bg-accent',
                outline: 'bg-background text-primary ring-primary hover:bg-accent',
                link: 'text-primary hover:underline',
            },
            size: {
                sm: 'rounded px-2 py-1 text-xs',
                default: 'rounded-md px-2.5 py-1.5 text-sm',
                lg: 'rounded-md px-3 py-2 text-base',
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
        ],
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);
/* eslint-enable vue/max-len */
</script>
