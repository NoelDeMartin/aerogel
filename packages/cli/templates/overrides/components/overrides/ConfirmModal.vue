<template>
    <ModalWrapper v-slot="{ close }" :title="title" :cancellable="false">
        <AGMarkdown :text="message" :actions="actions" />
        <div class="mt-4 flex flex-row-reverse">
            <AGButton :color="acceptColor" @click="close(true)">
                {{ renderedAcceptText }}
            </AGButton>
            <AGButton v-if="!required" :color="cancelColor" class="mr-2" @click="close(false)">
                {{ renderedCancelText }}
            </AGButton>
        </div>
    </ModalWrapper>
</template>

<script setup lang="ts">
import { useConfirmModal, useConfirmModalProps } from '@aerogel/core';

const props = defineProps(useConfirmModalProps());
const { renderedAcceptText, renderedCancelText } = useConfirmModal(props);
</script>
