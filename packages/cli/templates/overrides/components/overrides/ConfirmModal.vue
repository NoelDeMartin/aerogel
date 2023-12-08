<template>
    <ModalWrapper v-slot="{ close }" :title="title" :cancellable="false">
        <AGMarkdown :text="message" />
        <div class="mt-4 flex flex-row-reverse">
            <AGButton @click="close(true)">
                {{ renderedAcceptText }}
            </AGButton>
            <AGButton color="clear" class="mr-2" @click="close(false)">
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
