<template>
    <AGModal v-slot="{ close }: IModalDefaultSlotProps" :cancellable="false" :title="title">
        <AGMarkdown :text="message" :actions="actions" />

        <div class="mt-2 flex flex-row-reverse gap-2">
            <Button :variant="acceptColorVariant" @click="close(true)">
                {{ renderedAcceptText }}
            </Button>
            <Button v-if="!required" :variant="cancelColorVariant" @click="close()">
                {{ renderedCancelText }}
            </Button>
        </div>
    </AGModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useConfirmModal, useConfirmModalProps } from '@aerogel/core/components/modals/AGConfirmModal';
import type { IModalDefaultSlotProps } from '@aerogel/core/components/contracts/Modal';
import type { IButtonVariants } from '@aerogel/core/components/contracts/Button';

import AGModal from './AGModal.vue';
import Button from '../ui/Button.vue';
import AGMarkdown from '../lib/AGMarkdown.vue';

const props = defineProps(useConfirmModalProps());
const { renderedAcceptText, renderedCancelText } = useConfirmModal(props);
const cancelColorVariant = computed(() => props.cancelColor as IButtonVariants);
const acceptColorVariant = computed(() => props.acceptColor as IButtonVariants);
</script>
