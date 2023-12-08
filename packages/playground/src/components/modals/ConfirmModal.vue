<template>
    <BaseModal v-slot="{ close }" :title="title" :cancellable="false">
        <AGMarkdown :text="message" />

        <div class="mt-4 flex flex-row-reverse gap-2">
            <BaseButton @click="close(true)">
                {{ renderedAcceptText }}
            </BaseButton>
            <BaseButton color="clear" @click="close(false)">
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
