<template>
    <BaseModal :title="title">
        <AGMarkdown :text="message" />
    </BaseModal>
</template>

<script setup lang="ts">
import { useAlertModalProps } from '@aerogel/core';

defineProps(useAlertModalProps());
</script>
