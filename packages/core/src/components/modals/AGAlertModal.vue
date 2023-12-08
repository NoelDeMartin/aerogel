<template>
    <AGModal :title="title">
        <AGMarkdown :text="message" />
    </AGModal>
</template>

<script setup lang="ts">
import AGModal from './AGModal.vue';
import { useAlertModalProps } from './AGAlertModal';

import AGMarkdown from '../lib/AGMarkdown.vue';

defineProps(useAlertModalProps());
</script>
