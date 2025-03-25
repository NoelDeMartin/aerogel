<template>
    <AGHeadlessModal
        ref="$modal"
        v-slot="{ close }: IAGHeadlessModalDefaultSlotProps"
        v-bind="props"
        class="relative z-50"
    >
        <div class="fixed inset-0 flex items-center justify-center p-8">
            <AGHeadlessModalPanel class="flex max-h-full max-w-full flex-col overflow-hidden bg-white p-4">
                <AGHeadlessModalTitle v-if="title" class="mb-2 text-lg font-semibold">
                    <AGMarkdown :text="title" inline />
                </AGHeadlessModalTitle>
                <div class="flex max-h-full flex-col overflow-auto" v-bind="$attrs">
                    <slot :close="close" />
                </div>
            </AGHeadlessModalPanel>
        </div>
    </AGHeadlessModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { useModalExpose, useModalProps } from '@aerogel/core/components/headless/modals/AGHeadlessModal';
import type {
    IAGHeadlessModal,
    IAGHeadlessModalDefaultSlotProps,
} from '@aerogel/core/components/headless/modals/AGHeadlessModal';

import type { IAGModal } from './AGModal';

import AGHeadlessModal from '../headless/modals/AGHeadlessModal.vue';
import AGHeadlessModalPanel from '../headless/modals/AGHeadlessModalPanel.vue';
import AGHeadlessModalTitle from '../headless/modals/AGHeadlessModalTitle.vue';
import AGMarkdown from '../lib/AGMarkdown.vue';

const props = defineProps(useModalProps());
const $modal = ref<IAGHeadlessModal>();

defineOptions({ inheritAttrs: false });
defineExpose<IAGModal>(useModalExpose($modal));
</script>
