<template>
    <AGHeadlessModal
        ref="$modal"
        v-slot="{ close }"
        v-bind="modalProps"
        class="relative z-50"
    >
        <div class="z-10 overflow-y-auto" :class="{ 'fixed inset-0': !inline }">
            <div class="flex min-h-full items-center justify-center p-4 text-center">
                <AGHeadlessModalPanel
                    class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all"
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
                </AGHeadlessModalPanel>
            </div>
        </div>
    </AGHeadlessModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { booleanProp, extractModalProps, useModalExpose, useModalProps } from '@aerogel/core';
import type { IAGHeadlessModal, IAGModal } from '@aerogel/core';

const props = defineProps({
    noPadding: booleanProp(),
    ...useModalProps(),
});
const $modal = ref<IAGHeadlessModal>();
const modalProps = extractModalProps(props);

defineExpose<IAGModal>(useModalExpose($modal));
</script>
