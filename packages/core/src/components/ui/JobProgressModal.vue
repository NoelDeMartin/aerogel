<template>
    <Modal
        :title="message ?? $td('ui.processing', 'Processing...')"
        class="flex flex-col items-center justify-center p-6"
        persistent
        title-hidden
    >
        <div class="mt-8 flex items-center gap-2 font-medium text-slate-800" aria-hidden="true">
            <IconLoading class="text-primary-600 size-5 animate-spin" />
            <span>{{ message ?? $td('ui.processing', 'Processing...') }}</span>
        </div>
        <ProgressBar :job class="mt-2" />
        <Button
            v-if="job"
            variant="outline"
            class="mt-4"
            :disabled="cancelling"
            @click="((cancelling = true), job.cancel())"
        >
            {{ cancelling ? $td('ui.cancelling', 'Cancelling...') : $td('ui.cancel', 'Cancel') }}
        </Button>
    </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import IconLoading from '~icons/mdi/loading';

import Button from '@aerogel/core/components/ui/Button.vue';
import Modal from '@aerogel/core/components/ui/Modal.vue';
import ProgressBar from '@aerogel/core/components/ui/ProgressBar.vue';

import type {
    JobProgressModalExpose,
    JobProgressModalProps,
} from '@aerogel/core/components/contracts/JobProgressModal';

defineProps<JobProgressModalProps>();
defineExpose<JobProgressModalExpose>();

const cancelling = ref(false);
</script>
