<template>
    <BaseModal :title="title" :cancellable="false">
        <div
            class="flex"
            :class="{ 'flex-col-reverse': showProgress, 'items-center justify-center gap-2': !showProgress }"
        >
            <AGProgressBar v-if="showProgress" :progress="progress" />
            <i-svg-spinners:90-ring-with-bg v-else class="size-6 shrink-0" />
            <AGMarkdown :text="renderedMessage" />
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import { useLoadingModal, useLoadingModalProps } from '@aerogel/core';

const props = defineProps(useLoadingModalProps());
const { renderedMessage, showProgress } = useLoadingModal(props);
</script>
