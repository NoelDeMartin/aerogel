<template>
    <BaseModal no-padding>
        <div class="px-4 pb-4 pt-5">
            <h2 class="flex justify-between gap-4">
                <div class="flex items-center gap-2">
                    <i-zondicons-exclamation-solid class="h-5 w-5 text-red-600" aria-hidden="true" />
                    <AGErrorReportModalTitle
                        class="text-lg font-semibold leading-6 text-gray-900"
                        :report="report"
                        :current-report="activeReportIndex + 1"
                        :total-reports="reports.length"
                    />
                    <span v-if="reports.length > 1" class="flex gap-0.5">
                        <BaseButton
                            icon
                            color="clear"
                            :disabled="activeReportIndex === 0"
                            :aria-label="$t('errors.previousReport')"
                            :title="$t('errors.previousReport')"
                            @click="activeReportIndex--"
                        >
                            <i-zondicons-cheveron-left aria-hidden="true" class="h-4 w-4" />
                        </BaseButton>
                        <BaseButton
                            icon
                            color="clear"
                            :disabled="activeReportIndex === reports.length - 1"
                            :aria-label="$t('errors.nextReport')"
                            :title="$t('errors.nextReport')"
                            @click="activeReportIndex++"
                        >
                            <i-zondicons-cheveron-right aria-hidden="true" class="h-4 w-4" />
                        </BaseButton>
                    </span>
                </div>
                <AGErrorReportModalButtons :report="report" class="gap-0.5">
                    <template
                        #default="{
                            url,
                            handler,
                            iconComponent,
                            description,
                        }: IAGErrorReportModalButtonsDefaultSlotProps"
                    >
                        <ErrorReportModalButton
                            :url="url"
                            :aria-label="description"
                            :icon-component="iconComponent"
                            :description="description"
                            @click="handler"
                        />
                    </template>
                </AGErrorReportModalButtons>
            </h2>
            <AGMarkdown v-if="report.description" :text="report.description" class="text-gray-600" />
        </div>
        <div v-if="report.details" class="bg-red-grey -mt-2 max-h-[80vh] overflow-auto">
            <pre class="p-4 text-xs text-red-800" v-text="report.details" />
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import { useErrorReportModalProps } from '@aerogel/core';
import { computed, ref } from 'vue';
import type { ErrorReport, IAGErrorReportModalButtonsDefaultSlotProps } from '@aerogel/core';

const props = defineProps(useErrorReportModalProps());
const activeReportIndex = ref(0);
const report = computed(() => props.reports[activeReportIndex.value] as ErrorReport);
</script>
