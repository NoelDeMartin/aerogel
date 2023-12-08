<template>
    <ModalWrapper :cancellable="false">
        <AGMarkdown :text="renderedMessage" />
    </ModalWrapper>
</template>

<script setup lang="ts">
import { useLoadingModal, useLoadingModalProps } from '@aerogel/core';

const props = defineProps(useLoadingModalProps());
const { renderedMessage } = useLoadingModal(props);
</script>
