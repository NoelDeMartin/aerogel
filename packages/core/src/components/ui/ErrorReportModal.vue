<template>
    <Modal
        :title="$td('errors.report', 'Errors report')"
        title-hidden
        wrapper-class="p-0 sm:w-auto sm:min-w-lg sm:max-w-[80vw]"
        close-class="hidden"
    >
        <div class="px-4 pt-5 pb-4">
            <h2 class="flex justify-between gap-4">
                <div class="flex items-center gap-2">
                    <IconExclamationSolid class="size-5 text-red-600" />
                    <ErrorReportModalTitle
                        class="text-lg leading-6 font-semibold text-gray-900"
                        :report="report"
                        :current-report="activeReportIndex + 1"
                        :total-reports="reports.length"
                    />
                    <span v-if="reports.length > 1" class="flex gap-0.5">
                        <Button
                            size="icon"
                            variant="ghost"
                            :disabled="activeReportIndex === 0"
                            :aria-label="previousReportText"
                            :title="previousReportText"
                            @click="activeReportIndex--"
                        >
                            <IconCheveronLeft class="size-4" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            :disabled="activeReportIndex === reports.length - 1"
                            :aria-label="nextReportText"
                            :title="nextReportText"
                            @click="activeReportIndex++"
                        >
                            <IconCheveronRight class="size-4" />
                        </Button>
                    </span>
                </div>
                <ErrorReportModalButtons :report class="gap-0.5" />
            </h2>
            <Markdown v-if="report.description" :text="report.description" class="text-gray-600" />
        </div>
        <div class="-mt-2 max-h-[80vh] overflow-auto bg-red-800/10">
            <pre class="p-4 text-xs text-red-800" v-text="details" />
        </div>
    </Modal>
</template>

<script setup lang="ts">
import IconCheveronLeft from '~icons/zondicons/cheveron-left';
import IconCheveronRight from '~icons/zondicons/cheveron-right';
import IconExclamationSolid from '~icons/zondicons/exclamation-solid';

import Markdown from '@aerogel/core/components/ui/Markdown.vue';
import Button from '@aerogel/core/components/ui/Button.vue';
import ErrorReportModalButtons from '@aerogel/core/components/ui/ErrorReportModalButtons.vue';
import ErrorReportModalTitle from '@aerogel/core/components/ui/ErrorReportModalTitle.vue';
import Modal from '@aerogel/core/components/ui/Modal.vue';
import { useErrorReportModal } from '@aerogel/core/components/contracts/ErrorReportModal';
import type {
    ErrorReportModalExpose,
    ErrorReportModalProps,
} from '@aerogel/core/components/contracts/ErrorReportModal';

const props = defineProps<ErrorReportModalProps>();

const { activeReportIndex, details, nextReportText, previousReportText, report } = useErrorReportModal(props);

defineExpose<ErrorReportModalExpose>();
</script>
