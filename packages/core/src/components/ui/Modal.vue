<template>
    <HeadlessModal v-slot="{ close }" :persistent="persistent" v-bind="props">
        <HeadlessModalOverlay class="fixed inset-0 bg-gray-500/75" />

        <HeadlessModalContent :class="renderedWrapperClass">
            <div v-if="!persistent" class="absolute top-0 right-0 hidden pt-1.5 pr-1.5 sm:block">
                <Button variant="ghost" size="icon" @click="close()">
                    <span class="sr-only">{{ $td('ui.close', 'Close') }}</span>
                    <IconClose class="size-3 text-gray-400" />
                </Button>
            </div>

            <HeadlessModalTitle v-if="title" class="text-base font-semibold text-gray-900">
                <AGMarkdown :text="title" inline />
            </HeadlessModalTitle>

            <div :class="renderedContentClass">
                <slot :close="close" />
            </div>
        </HeadlessModalContent>
    </HeadlessModal>
</template>

<script setup lang="ts">
import IconClose from '~icons/zondicons/close';

import { computed } from 'vue';
import type { HTMLAttributes } from 'vue';

import AGMarkdown from '@aerogel/core/components/lib/AGMarkdown.vue';
import HeadlessModal from '@aerogel/core/components/headless/HeadlessModal.vue';
import HeadlessModalContent from '@aerogel/core/components/headless/HeadlessModalContent.vue';
import HeadlessModalOverlay from '@aerogel/core/components/headless/HeadlessModalOverlay.vue';
import HeadlessModalTitle from '@aerogel/core/components/headless/HeadlessModalTitle.vue';
import { classes } from '@aerogel/core/components/utils';
import type { IModalProps, IModalSlots } from '@aerogel/core/components/contracts/Modal';

const {
    class: contentClass = '',
    wrapperClass = '',
    title,
    persistent,
    ...props
} = defineProps<IModalProps & { wrapperClass?: HTMLAttributes['class']; class?: HTMLAttributes['class'] }>();

defineSlots<IModalSlots>();

const renderedContentClass = computed(() => classes({ 'mt-2': title }, contentClass));
const renderedWrapperClass = computed(() =>
    classes(
        // eslint-disable-next-line vue/max-len
        'fixed top-1/2 left-1/2 z-50 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl sm:max-w-lg',
        wrapperClass,
    ));
</script>
