<template>
    <HeadlessToast :class="renderedClasses">
        <Markdown v-if="message" :text="message" inline />

        <Button
            v-for="(action, index) of actions"
            :key="index"
            :as="HeadlessToastAction"
            :action="action"
            :variant="variant"
        />
    </HeadlessToast>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

import Button from '@aerogel/core/components/ui/Button.vue';
import Markdown from '@aerogel/core/components/ui/Markdown.vue';
import HeadlessToast from '@aerogel/core/components/headless/HeadlessToast.vue';
import HeadlessToastAction from '@aerogel/core/components/headless/HeadlessToastAction.vue';
import { computedVariantClasses } from '@aerogel/core/components/utils';
import type { ToastProps } from '@aerogel/core/components/contracts/Toast';
import type { Variants } from '@aerogel/core/components/utils';

const { class: baseClasses, variant = 'secondary' } = defineProps<ToastProps & { class?: HTMLAttributes['class'] }>();
const renderedClasses = computedVariantClasses<Variants<Pick<ToastProps, 'variant'>>>(
    { baseClasses, variant },
    {
        baseClasses: 'flex items-center gap-2 rounded-md p-2 ring-1 shadow-lg border-gray-200',
        variants: {
            variant: {
                secondary: 'bg-gray-900 text-white ring-black',
                danger: 'bg-red-50 text-red-900 ring-red-100',
            },
        },
        defaultVariants: {
            variant: 'secondary',
        },
    },
);
</script>
