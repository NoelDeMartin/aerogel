<template>
    <ModalWrapper>
        <AGErrorReportModalTitle
            :report="report"
            :current-report="activeReportIndex + 1"
            :total-reports="reports.length"
        />
        <Button color="ghost" :disabled="activeReportIndex === 0" @click="activeReportIndex--">
            {{ previousReportText }}
        </Button>
        <Button color="ghost" :disabled="activeReportIndex === reports.length - 1" @click="activeReportIndex++">
            {{ nextReportText }}
        </Button>
        <AGErrorReportModalButtons :report="report">
            <template
                #default="{ url, handler, iconComponent, description }: IAGErrorReportModalButtonsDefaultSlotProps"
            >
                <Button :url="url" :aria-label="description" @click="handler">
                    <component :is="iconComponent" />
                    {{ description }}
                </Button>
            </template>
        </AGErrorReportModalButtons>
        <AGMarkdown v-if="report.description" :text="report.description" />
        <pre v-text="details" />
    </ModalWrapper>
</template>

<script setup lang="ts">
import { useErrorReportModal, useErrorReportModalProps } from '@aerogel/core';
import type { IAGErrorReportModalButtonsDefaultSlotProps } from '@aerogel/core';

const props = defineProps(useErrorReportModalProps());
const { activeReportIndex, details, nextReportText, previousReportText, report } = useErrorReportModal(props);
</script>
