<template>
    <AGMarkdown :text="text" inline />
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { numberProp, requiredObjectProp } from '@/utils/vue';
import type { ErrorReport } from '@/errors';

import AGMarkdown from '../basic/AGMarkdown.vue';

const props = defineProps({
    report: requiredObjectProp<ErrorReport>(),
    currentReport: numberProp(),
    totalReports: numberProp(),
});
const text = computed(() => {
    if (!props.totalReports || props.totalReports <= 1) {
        return props.report.title;
    }

    return `${props.report.title} (${props.currentReport}/${props.totalReports})`;
});
</script>
