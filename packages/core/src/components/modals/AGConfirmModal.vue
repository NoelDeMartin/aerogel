<template>
    <AGModal v-slot="{ close }: IModalDefaultSlotProps" :cancellable="false" :title="title">
        <AGMarkdown :text="message" :actions="actions" />

        <div class="mt-2 flex flex-row-reverse gap-2">
            <AGButton :color="acceptColor" @click="close(true)">
                {{ renderedAcceptText }}
            </AGButton>
            <AGButton v-if="!required" :color="cancelColor" @click="close()">
                {{ renderedCancelText }}
            </AGButton>
        </div>
    </AGModal>
</template>

<script setup lang="ts">
import type { IModalDefaultSlotProps } from '@aerogel/core/components/contracts/Modal';

import AGModal from './AGModal.vue';
import { useConfirmModal, useConfirmModalProps } from './AGConfirmModal';

import AGButton from '../forms/AGButton.vue';
import AGMarkdown from '../lib/AGMarkdown.vue';

const props = defineProps(useConfirmModalProps());
const { renderedAcceptText, renderedCancelText } = useConfirmModal(props);
</script>
