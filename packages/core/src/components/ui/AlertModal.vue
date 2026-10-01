<template>
    <Modal :title="renderedTitle" :title-hidden="titleHidden">
        <Markdown :text="message" />
    </Modal>
</template>

<script setup lang="ts">
import { useAlertModal } from '@aerogel/core/components/contracts/AlertModal';
import type { AlertModalExpose, AlertModalProps } from '@aerogel/core/components/contracts/AlertModal';
import Markdown from '@aerogel/core/components/ui/Markdown.vue';
import Modal from '@aerogel/core/components/ui/Modal.vue';

const props = defineProps<AlertModalProps>();
const { renderedTitle, titleHidden } = useAlertModal(props);

defineExpose<AlertModalExpose>();
</script>
