<template>
    <Modal :title="renderedTitle" :title-hidden="titleHidden">
        <Markdown :text="message" />
    </Modal>
</template>

<script setup lang="ts">
import Modal from '@aerogel/core/components/ui/Modal.vue';
import Markdown from '@aerogel/core/components/ui/Markdown.vue';
import { useAlertModal } from '@aerogel/core/components/contracts/AlertModal';
import type { AlertModalExpose, AlertModalProps } from '@aerogel/core/components/contracts/AlertModal';

const props = defineProps<AlertModalProps>();
const { renderedTitle, titleHidden } = useAlertModal(props);

defineExpose<AlertModalExpose>();
</script>
