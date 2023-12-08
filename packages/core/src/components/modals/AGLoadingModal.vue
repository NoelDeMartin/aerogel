<template>
    <AGModal :cancellable="false">
        <AGMarkdown :text="renderedMessage" />
    </AGModal>
</template>

<script setup lang="ts">
import AGModal from './AGModal.vue';
import { useLoadingModal, useLoadingModalProps } from './AGLoadingModal';

import AGMarkdown from '../lib/AGMarkdown.vue';

const props = defineProps(useLoadingModalProps());
const { renderedMessage } = useLoadingModal(props);
</script>
