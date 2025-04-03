<template>
    <AGHeadlessModal
        ref="$modal"
        v-slot="{ close }: IAGHeadlessModalDefaultSlotProps"
        v-bind="props"
        class="relative"
    >
        <AGHeadlessModalContent
            class="fixed top-1/2 left-1/2 z-50 max-w-lg -translate-x-1/2 -translate-y-1/2 bg-white p-4"
        >
            <AGHeadlessModalTitle v-if="title" class="mb-2 text-lg font-semibold">
                <AGMarkdown :text="title" inline />
            </AGHeadlessModalTitle>
            <div class="flex max-h-full flex-col overflow-auto" v-bind="$attrs">
                <slot :close="close" />
            </div>
        </AGHeadlessModalContent>
    </AGHeadlessModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { AGHeadlessModalTitle } from '@aerogel/core/components/headless/modals';
import { modalExpose, modalProps } from '@aerogel/core/components/headless/modals/AGHeadlessModal';
import type {
    IAGHeadlessModal,
    IAGHeadlessModalDefaultSlotProps,
} from '@aerogel/core/components/headless/modals/AGHeadlessModal';

import AGHeadlessModal from '../headless/modals/AGHeadlessModal.vue';
import AGHeadlessModalContent from '../headless/modals/AGHeadlessModalContent.vue';
import AGMarkdown from '../lib/AGMarkdown.vue';

const props = defineProps(modalProps());
const $modal = ref<IAGHeadlessModal>();

defineOptions({ inheritAttrs: false });
defineExpose(modalExpose($modal));
</script>
