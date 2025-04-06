<template>
    <ModalWrapper :title="title">
        <Markdown :text="message" />
    </ModalWrapper>
</template>

<script setup lang="ts">
import { useAlertModalProps } from '@aerogel/core';

defineProps(useAlertModalProps());
</script>
