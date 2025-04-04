<template>
    <Modal :title="title">
        <AGMarkdown :text="message" />
    </Modal>
</template>

<script setup lang="ts">
import Modal from '@aerogel/core/components/ui/Modal.vue';
import AGMarkdown from '@aerogel/core/components/lib/AGMarkdown.vue';
import type { AlertModalProps } from '@aerogel/core/components/contracts/AlertModal';

defineProps<AlertModalProps>();
</script>
