<template>
    <ModalWrapper v-slot="{ close }" :title="title" persistent>
        <Markdown :text="message" :actions="actions" />
        <div class="mt-4 flex flex-row-reverse">
            <Button :variant="acceptColor" @click="close(true)">
                {{ renderedAcceptText }}
            </Button>
            <Button v-if="!required" :variant="cancelColor" class="mr-2" @click="close(false)">
                {{ renderedCancelText }}
            </Button>
        </div>
    </ModalWrapper>
</template>

<script setup lang="ts">
import { useConfirmModal, useConfirmModalProps } from '@aerogel/core';

const props = defineProps(useConfirmModalProps());
const { renderedAcceptText, renderedCancelText } = useConfirmModal(props);
</script>
