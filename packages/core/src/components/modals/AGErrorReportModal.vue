<template>
    <AGModal>
        <div>
            <h2 class="flex items-center justify-between text-lg font-medium">
                <div class="flex items-center">
                    <AGErrorReportModalTitle
                        :report="report"
                        :current-report="activeReportIndex + 1"
                        :total-reports="reports.length"
                    />
                    <template v-if="reports.length > 1">
                        <AGButton
                            clear
                            :disabled="activeReportIndex === 0"
                            :title="$td('errors.previousReport', 'Show previous report')"
                            :aria-label="$td('errors.previousReport', 'Show previous report')"
                            @click="activeReportIndex--"
                        >
                            <IconCheveronLeft aria-hidden="true" class="h-4 w-4" />
                        </AGButton>
                        <AGButton
                            clear
                            :disabled="activeReportIndex === reports.length - 1"
                            :title="$td('errors.nextReport', 'Show next report')"
                            :aria-label="$td('errors.nextReport', 'Show next report')"
                            @click="activeReportIndex++"
                        >
                            <IconCheveronRight aria-hidden="true" class="h-4 w-4" />
                        </AGButton>
                    </template>
                </div>
                <AGErrorReportModalButtons :report="report" />
            </h2>
            <AGMarkdown v-if="report.description" :text="report.description" class="mt-2" />
        </div>
        <pre
            class="h-full overflow-auto bg-gray-200 p-4 text-xs text-red-900"
            v-text="report.details ?? $td('errors.detailsEmpty', 'This error is missing a stacktrace.')"
        />
    </AGModal>
</template>

<script setup lang="ts">
import IconCheveronRight from '~icons/zondicons/cheveron-right';
import IconCheveronLeft from '~icons/zondicons/cheveron-left';

import { computed, ref } from 'vue';

import type { ErrorReport } from '@/errors';

import { useErrorReportModalProps } from './AGErrorReportModal';

import AGButton from '../forms/AGButton.vue';
import AGErrorReportModalButtons from './AGErrorReportModalButtons.vue';
import AGErrorReportModalTitle from './AGErrorReportModalTitle.vue';
import AGMarkdown from '../basic/AGMarkdown.vue';
import AGModal from './AGModal.vue';

const props = defineProps(useErrorReportModalProps());
const activeReportIndex = ref(0);
const report = computed(() => props.reports[activeReportIndex.value] as ErrorReport);
</script>
