<template>
    <Markdown :text inline />
</template>

<script setup lang="ts">
import Markdown from '@aerogel/core/components/ui/Markdown.vue';
import type { ErrorReport } from '@aerogel/core/errors';
import { computed } from 'vue';

const { totalReports, currentReport, report } = defineProps<{
    report: ErrorReport;
    currentReport?: number;
    totalReports?: number;
}>();

const text = computed(() => {
    if (!totalReports || totalReports <= 1) {
        return report.title;
    }

    return `${report.title} (${currentReport}/${totalReports})`;
});
</script>
