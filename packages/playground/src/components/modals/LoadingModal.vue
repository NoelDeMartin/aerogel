<template>
    <BaseModal :cancellable="false">
        <div class="flex items-center justify-center gap-2">
            <i-svg-spinners:90-ring-with-bg class="h-6 w-6" />
            <AGMarkdown :text="renderedMessage" />
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import { useLoadingModal, useLoadingModalProps } from '@aerogel/core';

const props = defineProps(useLoadingModalProps());
const { renderedMessage } = useLoadingModal(props);
</script>
