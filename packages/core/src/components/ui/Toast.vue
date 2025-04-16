<template>
    <HeadlessToast :class="renderedClasses">
        <Markdown v-if="message" :text="message" inline />

        <Button
            v-for="(action, key) of actions"
            :key
            :action
            :variant
            :as="HeadlessToastAction"
        />
    </HeadlessToast>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { HTMLAttributes } from 'vue';

import Button from '@aerogel/core/components/ui/Button.vue';
import Markdown from '@aerogel/core/components/ui/Markdown.vue';
import HeadlessToast from '@aerogel/core/components/headless/HeadlessToast.vue';
import HeadlessToastAction from '@aerogel/core/components/headless/HeadlessToastAction.vue';
import { variantClasses } from '@aerogel/core/utils/classes';
import type { ToastExpose, ToastProps } from '@aerogel/core/components/contracts/Toast';
import type { Variants } from '@aerogel/core/utils/classes';

const { class: baseClasses, variant = 'secondary' } = defineProps<ToastProps & { class?: HTMLAttributes['class'] }>();
const renderedClasses = computed(() =>
    variantClasses<Variants<Pick<ToastProps, 'variant'>>>(
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
    ));

defineExpose<ToastExpose>();
</script>
