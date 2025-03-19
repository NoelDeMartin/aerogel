<template>
    <AGHeadlessModal
        ref="$modal"
        v-slot="{ close }: IAGHeadlessModalDefaultSlotProps"
        v-bind="props"
        class="relative z-50"
    >
        <div class="fixed inset-0 z-10 overflow-y-auto">
            <div class="flex min-h-full items-center justify-center p-4 text-center">
                <AGHeadlessModalPanel class="relative overflow-hidden rounded-xl bg-white p-4 text-left shadow-xl">
                    <AGHeadlessModalTitle v-if="title" class="text-lg font-semibold leading-6 text-gray-900">
                        <AGMarkdown :text="title" inline />
                    </AGHeadlessModalTitle>
                    <AGMarkdown
                        v-if="title && description"
                        :text="description"
                        class="mt-1 text-sm leading-6 text-gray-500"
                    />
                    <div class="-mx-4 -mb-4 max-h-[90vh] overflow-y-auto overflow-x-hidden [&>*]:overflow-hidden">
                        <div class="px-4 pb-4" :class="{ 'pt-3': title }">
                            <slot :close="close" />
                        </div>
                    </div>
                </AGHeadlessModalPanel>
            </div>
        </div>
    </AGHeadlessModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { modalExpose, modalProps } from '@/components/headless/modals/AGHeadlessModal';
import type { IAGHeadlessModal, IAGHeadlessModalDefaultSlotProps } from '@/components/headless/modals/AGHeadlessModal';

import AGHeadlessModal from '../headless/modals/AGHeadlessModal.vue';
import AGHeadlessModalPanel from '../headless/modals/AGHeadlessModalPanel.vue';
import AGHeadlessModalTitle from '../headless/modals/AGHeadlessModalTitle.vue';
import AGMarkdown from '../lib/AGMarkdown.vue';

const props = defineProps(modalProps());
const $modal = ref<IAGHeadlessModal>();

defineOptions({ inheritAttrs: false });
defineExpose(modalExpose($modal));
</script>
