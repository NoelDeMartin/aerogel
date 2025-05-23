<template>
    <!-- @vue-generic {T} -->
    <HeadlessModal
        v-slot="{ close }"
        v-bind="props"
        :ref="($modal) => forwardRef($modal as HeadlessModalInstance)"
        :persistent
    >
        <HeadlessModalOverlay
            class="fixed inset-0 animate-[fade-in_var(--tw-duration)_ease-in-out] transition-opacity duration-300 will-change-[opacity]"
            :class="{
                'bg-black/30': context.childIndex === 1,
                'opacity-0': context.childIndex === 1 && context.modal.closing,
            }"
        />
        <HeadlessModalContent v-bind="contentProps" :class="renderedWrapperClass">
            <div v-if="!persistent && !closeHidden" class="absolute top-0 right-0 hidden pt-3.5 pr-2.5 sm:block">
                <button
                    type="button"
                    class="clickable z-10 rounded-full p-2.5 text-gray-400 hover:text-gray-500"
                    @click="close()"
                >
                    <span class="sr-only">{{ $td('ui.close', 'Close') }}</span>
                    <IconClose class="size-4" />
                </button>
            </div>

            <HeadlessModalTitle
                v-if="title"
                class="px-4 pt-5 text-base font-semibold text-gray-900"
                :class="{
                    'sr-only': titleHidden,
                    'pb-0': description && !descriptionHidden,
                    'pb-2': !description || descriptionHidden,
                }"
            >
                <Markdown :text="title" inline />
            </HeadlessModalTitle>

            <HeadlessModalDescription
                v-if="description"
                class="px-4 pt-1 pb-2"
                :class="{ 'sr-only': descriptionHidden }"
            >
                <Markdown :text="description" class="text-sm leading-6 text-gray-500" />
            </HeadlessModalDescription>

            <div :class="renderedContentClass">
                <slot :close />
            </div>
        </HeadlessModalContent>
    </HeadlessModal>
</template>

<script setup lang="ts" generic="T = void">
import IconClose from '~icons/zondicons/close';

import { after } from '@noeldemartin/utils';
import { computed } from 'vue';
import { useForwardExpose } from 'reka-ui';
import type { ComponentPublicInstance, HTMLAttributes, Ref } from 'vue';
import type { Nullable } from '@noeldemartin/utils';

import Markdown from '@aerogel/core/components/ui/Markdown.vue';
import HeadlessModal from '@aerogel/core/components/headless/HeadlessModal.vue';
import HeadlessModalContent from '@aerogel/core/components/headless/HeadlessModalContent.vue';
import HeadlessModalDescription from '@aerogel/core/components/headless/HeadlessModalDescription.vue';
import HeadlessModalOverlay from '@aerogel/core/components/headless/HeadlessModalOverlay.vue';
import HeadlessModalTitle from '@aerogel/core/components/headless/HeadlessModalTitle.vue';
import UI from '@aerogel/core/ui/UI';
import { classes } from '@aerogel/core/utils/classes';
import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import { useEvent } from '@aerogel/core/utils/composition/events';
import type { AcceptRefs } from '@aerogel/core/utils/vue';
import type { ModalExpose, ModalProps, ModalSlots } from '@aerogel/core/components/contracts/Modal';
import type { UIModalContext } from '@aerogel/core/ui/UI';

type HeadlessModalInstance = ComponentPublicInstance & ModalExpose<T>;

const {
    class: contentClass = '',
    wrapperClass = '',
    title,
    titleHidden,
    description,
    persistent,
    closeHidden,
    ...props
} = defineProps<
    ModalProps & {
        wrapperClass?: HTMLAttributes['class'];
        class?: HTMLAttributes['class'];
        closeHidden?: boolean;
    }
>();

defineSlots<ModalSlots<T>>();
defineExpose<AcceptRefs<ModalExpose<T>>>({
    close: async (result) => $modal.value?.close(result),
    $content: computed(() => $modal.value?.$content),
});

const { forwardRef, currentRef } = useForwardExpose<HeadlessModalInstance>();
const $modal = currentRef as Ref<Nullable<HeadlessModalInstance>>;
const context = injectReactiveOrFail<UIModalContext>('modal');
const inForeground = computed(() => !context.modal.closing && context.childIndex === UI.openModals.length);
const contentProps = computed(() => (description ? {} : { 'aria-describedby': undefined }));
const renderedContentClass = computed(() =>
    classes('max-h-[90vh] overflow-auto px-4 pb-4', { 'pt-4': !title || titleHidden }, contentClass));
const renderedWrapperClass = computed(() =>
    classes(
        'isolate fixed top-1/2 left-1/2 z-50 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2',
        'overflow-hidden rounded-lg bg-white text-left shadow-xl sm:max-w-lg',
        'animate-[fade-in_var(--tw-duration)_ease-in-out,grow_var(--tw-duration)_ease-in-out]',
        'transition-[scale,opacity] will-change-[scale,opacity] duration-300',
        {
            'scale-50 opacity-0': !inForeground.value,
            'scale-100 opacity-100': inForeground.value,
        },
        wrapperClass,
    ));

useEvent('modal-will-close', async ({ modal: { id } }) => {
    if (id !== context.modal.id) {
        return;
    }

    // Wait for transitions to finish
    await after({ ms: 300 });
});
</script>
