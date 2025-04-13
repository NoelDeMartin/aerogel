<template>
    <Modal :title>
        <Markdown :text="message" />
    </Modal>
</template>

<script setup lang="ts">
import Modal from '@aerogel/core/components/ui/Modal.vue';
import Markdown from '@aerogel/core/components/ui/Markdown.vue';
import type { AlertModalExpose, AlertModalProps } from '@aerogel/core/components/contracts/AlertModal';

defineProps<AlertModalProps>();
defineExpose<AlertModalExpose>();
</script>
