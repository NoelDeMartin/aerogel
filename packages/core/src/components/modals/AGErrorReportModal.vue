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
                            color="clear"
                            :disabled="activeReportIndex === 0"
                            :title="previousReportText"
                            :aria-label="previousReportText"
                            @click="activeReportIndex--"
                        >
                            <IconCheveronLeft aria-hidden="true" class="h-4 w-4" />
                        </AGButton>
                        <AGButton
                            color="clear"
                            :disabled="activeReportIndex === reports.length - 1"
                            :title="nextReportText"
                            :aria-label="nextReportText"
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
        <pre class="h-full overflow-auto bg-gray-200 p-4 text-xs text-red-900" v-text="details" />
    </AGModal>
</template>

<script setup lang="ts">
import IconCheveronRight from '~icons/zondicons/cheveron-right';
import IconCheveronLeft from '~icons/zondicons/cheveron-left';

import { useErrorReportModal, useErrorReportModalProps } from './AGErrorReportModal';

import AGButton from '../forms/AGButton.vue';
import AGErrorReportModalButtons from './AGErrorReportModalButtons.vue';
import AGErrorReportModalTitle from './AGErrorReportModalTitle.vue';
import AGMarkdown from '../lib/AGMarkdown.vue';
import AGModal from './AGModal.vue';

const props = defineProps(useErrorReportModalProps());
const { activeReportIndex, details, nextReportText, previousReportText, report } = useErrorReportModal(props);
</script>
