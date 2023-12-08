<template>
    <ModalWrapper :title="title">
        <AGMarkdown :text="message" />
    </ModalWrapper>
</template>

<script setup lang="ts">
import { useAlertModalProps } from '@aerogel/core';

defineProps(useAlertModalProps());
</script>
