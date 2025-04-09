<template>
    <HeadlessModal
        v-slot="{ close }"
        v-bind="props"
        ref="$modal"
        :persistent
    >
        <HeadlessModalOverlay class="fixed inset-0 bg-gray-500/75" />

        <HeadlessModalContent :class="renderedWrapperClass">
            <div v-if="!persistent && dismissable" class="absolute top-0 right-0 hidden pt-1.5 pr-1.5 sm:block">
                <Button variant="ghost" size="icon" @click="close()">
                    <span class="sr-only">{{ $td('ui.close', 'Close') }}</span>
                    <IconClose class="size-3 text-gray-400" />
                </Button>
            </div>

            <HeadlessModalTitle v-if="title" class="text-base font-semibold text-gray-900">
                <Markdown :text="title" inline />
            </HeadlessModalTitle>

            <div :class="renderedContentClass">
                <slot :close />
            </div>
        </HeadlessModalContent>
    </HeadlessModal>
</template>

<script setup lang="ts">
import IconClose from '~icons/zondicons/close';

import { computed, useTemplateRef } from 'vue';
import type { HTMLAttributes } from 'vue';

import Markdown from '@aerogel/core/components/ui/Markdown.vue';
import Button from '@aerogel/core/components/ui/Button.vue';
import HeadlessModal from '@aerogel/core/components/headless/HeadlessModal.vue';
import HeadlessModalContent from '@aerogel/core/components/headless/HeadlessModalContent.vue';
import HeadlessModalOverlay from '@aerogel/core/components/headless/HeadlessModalOverlay.vue';
import HeadlessModalTitle from '@aerogel/core/components/headless/HeadlessModalTitle.vue';
import { classes } from '@aerogel/core/utils/classes';
import type { ModalExpose, ModalProps, ModalSlots } from '@aerogel/core/components/contracts/Modal';

const {
    class: contentClass = '',
    dismissable = true,
    wrapperClass = '',
    title,
    persistent,
    ...props
} = defineProps<
    ModalProps & {
        dismissable?: boolean;
        wrapperClass?: HTMLAttributes['class'];
        class?: HTMLAttributes['class'];
    }
>();

const $modal = useTemplateRef('$modal');
const renderedContentClass = computed(() => classes({ 'mt-2': title }, contentClass));
const renderedWrapperClass = computed(() =>
    classes(
        // eslint-disable-next-line vue/max-len
        'fixed top-1/2 left-1/2 z-50 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl sm:max-w-lg',
        wrapperClass,
    ));

defineSlots<ModalSlots>();
defineExpose<ModalExpose>({ close: async () => $modal.value?.close() });
</script>
