<template>
    <AGHeadlessModal v-slot="{ close }: IAGHeadlessModalDefaultSlotProps" class="relative z-50">
        <div class="fixed inset-0 flex items-center justify-center">
            <AGHeadlessModalPanel class="flex max-h-full max-w-full flex-col overflow-hidden bg-white">
                <div class="flex max-h-full flex-col overflow-auto p-4">
                    <slot :close="close" />
                </div>
            </AGHeadlessModalPanel>
        </div>
    </AGHeadlessModal>
</template>

<script setup lang="ts">
import type { IAGHeadlessModalDefaultSlotProps } from '@/components/headless/modals/AGHeadlessModal';

import AGHeadlessModal from '../headless/modals/AGHeadlessModal.vue';
import AGHeadlessModalPanel from '../headless/modals/AGHeadlessModalPanel.vue';
</script>
