<template>
    <BaseModal no-padding>
        <div class="px-4 pt-5 pb-4">
            <h2 class="flex justify-between gap-4">
                <div class="flex items-center gap-2">
                    <i-zondicons-exclamation-solid class="size-5 text-red-600" />
                    <AGErrorReportModalTitle
                        class="text-lg leading-6 font-semibold text-gray-900"
                        :report="report"
                        :current-report="activeReportIndex + 1"
                        :total-reports="reports.length"
                    />
                    <span v-if="reports.length > 1" class="flex gap-0.5">
                        <Button
                            icon
                            color="clear"
                            :disabled="activeReportIndex === 0"
                            :aria-label="previousReportText"
                            :title="previousReportText"
                            @click="activeReportIndex--"
                        >
                            <i-zondicons-cheveron-left class="size-4" />
                        </Button>
                        <Button
                            icon
                            color="clear"
                            :disabled="activeReportIndex === reports.length - 1"
                            :aria-label="nextReportText"
                            :title="nextReportText"
                            @click="activeReportIndex++"
                        >
                            <i-zondicons-cheveron-right class="size-4" />
                        </Button>
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
                        <Button
                            color="clear"
                            class="group whitespace-nowrap"
                            :url="url"
                            :aria-label="description"
                            @click="handler"
                        >
                            <component :is="iconComponent" class="size-4" />
                            <AGMeasured
                                class="w-0 overflow-hidden transition-[width] group-hover:w-(--width) group-focus:w-(--width)"
                            >
                                {{ description }}
                            </AGMeasured>
                        </Button>
                    </template>
                </AGErrorReportModalButtons>
            </h2>
            <AGMarkdown v-if="report.description" :text="report.description" class="text-gray-600" />
        </div>
        <div class="bg-red-grey -mt-2 max-h-[80vh] overflow-auto">
            <pre class="p-4 text-xs text-red-800" v-text="details" />
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import { useErrorReportModal, useErrorReportModalProps } from '@aerogel/core';
import type { IAGErrorReportModalButtonsDefaultSlotProps } from '@aerogel/core';

const props = defineProps(useErrorReportModalProps());
const { activeReportIndex, details, nextReportText, previousReportText, report } = useErrorReportModal(props);
</script>
