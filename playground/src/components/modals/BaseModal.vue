<template>
    <AGHeadlessModal
        ref="$modal"
        v-slot="{ close }"
        v-bind="baseModalProps"
        class="relative"
    >
        <AGHeadlessModalContent
            class="fixed top-1/2 left-1/2 z-50 max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white text-left shadow-xl"
            :class="{ 'px-4 pt-5 pb-4': !noPadding }"
        >
            <BaseButton
                v-if="title && cancellable"
                color="clear"
                class="absolute top-3 right-1"
                icon
                :title="$t('ui.close')"
                :aria-label="$t('ui.close')"
                @click="close()"
            >
                <i-mdi-close class="size-4" />
            </BaseButton>
            <AGHeadlessModalTitle v-if="title" class="mr-12 text-base leading-6 font-semibold text-gray-900">
                <AGMarkdown :text="title" inline />
            </AGHeadlessModalTitle>
            <div :class="{ 'mt-3': title }">
                <slot :close="close" />
            </div>
        </AGHeadlessModalContent>
    </AGHeadlessModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { booleanProp, extractModalProps, modalExpose, modalProps } from '@aerogel/core';
import type { IAGHeadlessModal } from '@aerogel/core';

const props = defineProps({
    noPadding: booleanProp(),
    ...modalProps(),
});
const $modal = ref<IAGHeadlessModal>();
const baseModalProps = extractModalProps(props);

defineExpose(modalExpose($modal));
</script>
