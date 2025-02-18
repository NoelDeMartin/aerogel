<template>
    <BaseModal v-slot="{ close }" :title="title" :cancellable="false">
        <AGMarkdown :text="message" :actions="actions" />

        <div class="mt-4 flex flex-row-reverse gap-2">
            <BaseButton :color="acceptColor" @click="close(true)">
                {{ renderedAcceptText }}
            </BaseButton>
            <BaseButton :color="cancelColor" @click="close(false)">
                {{ renderedCancelText }}
            </BaseButton>
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import { useConfirmModal, useConfirmModalProps } from '@aerogel/core';

const props = defineProps(useConfirmModalProps());
const { renderedAcceptText, renderedCancelText } = useConfirmModal(props);
</script>
