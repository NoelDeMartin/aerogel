<template>
    <AGHeadlessModal
        ref="$headlessModal"
        v-slot="{ close }: IAGHeadlessModalDefaultSlotProps"
        :cancellable="cancellable"
        class="relative z-50"
    >
        <div class="fixed inset-0 flex items-center justify-center p-8">
            <AGHeadlessModalPanel class="flex max-h-full max-w-full flex-col overflow-hidden bg-white">
                <div class="flex max-h-full flex-col overflow-auto p-4">
                    <slot :close="close" />
                </div>
            </AGHeadlessModalPanel>
        </div>
    </AGHeadlessModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { booleanProp } from '@/utils';
import type { IAGHeadlessModal, IAGHeadlessModalDefaultSlotProps } from '@/components/headless/modals/AGHeadlessModal';

import type { IAGModal } from './AGModal';

import AGHeadlessModal from '../headless/modals/AGHeadlessModal.vue';
import AGHeadlessModalPanel from '../headless/modals/AGHeadlessModalPanel.vue';

const $headlessModal = ref<IAGHeadlessModal>();

defineProps({ cancellable: booleanProp(true) });
defineExpose<IAGModal>({
    close: async () => $headlessModal.value?.close(),
    cancellable: computed(() => !!$headlessModal.value?.cancellable),
});
</script>
