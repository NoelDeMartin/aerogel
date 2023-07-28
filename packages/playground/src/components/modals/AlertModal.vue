<template>
    <BaseModal :title="title">
        <AGMarkdown :text="message" />
    </BaseModal>
</template>

<script setup lang="ts">
import { requiredStringProp, stringProp } from '@aerogel/core';

defineProps({
    title: stringProp(),
    message: requiredStringProp(),
});
</script>
