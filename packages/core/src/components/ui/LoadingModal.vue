<template>
    <Modal
        persistent
        class="flex"
        wrapper-class="w-auto"
        :title="title"
        :class="{ 'flex-col-reverse': showProgress, 'items-center justify-center gap-2': !showProgress }"
    >
        <ProgressBar
            v-if="showProgress"
            :progress="progress"
            :job="job"
            class="min-w-[min(400px,80vw)]"
        />
        <IconSpinner v-else class="text-primary mr-1 size-6" />
        <AGMarkdown :text="renderedMessage" />
    </Modal>
</template>

<script setup lang="ts">
import IconSpinner from '~icons/svg-spinners/90-ring-with-bg';

import AGMarkdown from '@aerogel/core/components/lib/AGMarkdown.vue';
import Modal from '@aerogel/core/components/ui/Modal.vue';
import ProgressBar from '@aerogel/core/components/ui/ProgressBar.vue';
import { useLoadingModal } from '@aerogel/core/components/contracts/LoadingModal';
import type { ILoadingModalProps } from '@aerogel/core/components/contracts/LoadingModal';

const props = defineProps<ILoadingModalProps>();

const { renderedMessage, showProgress } = useLoadingModal(props);
</script>
