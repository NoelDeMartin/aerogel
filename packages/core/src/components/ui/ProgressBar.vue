<template>
    <div class="relative mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div :class="filledClasses" :style="`transform:translateX(-${(1 - renderedProgress) * 100}%)`" />
        <div
            v-if="overflowWidthPercentage"
            :class="overflowClasses"
            :style="{ width: `${overflowWidthPercentage}%` }"
        />
        <span class="sr-only">
            {{
                $td('ui.progress', '{progress}% complete', {
                    progress: renderedProgress * 100,
                })
            }}
        </span>
    </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';

import { classes } from '@aerogel/core/utils/classes';
import type Job from '@aerogel/core/jobs/Job';
import type { Falsifiable } from '@aerogel/core/utils';

const { filledClass, overflowClass, progress, job } = defineProps<{
    filledClass?: string;
    overflowClass?: string;
    progress?: number;
    job?: Falsifiable<Job>;
}>();

let cleanup: Falsifiable<Function>;
const jobProgress = ref(0);
const filledClasses = computed(() =>
    classes('size-full transition-transform duration-500 rounded-r-full ease-linear bg-primary-600', filledClass));
const overflowClasses = computed(() =>
    classes(
        'absolute inset-y-0 right-0 size-full rounded-r-full',
        'bg-primary-900 transition-[width] duration-500 ease-linear',
        overflowClass,
    ));
const renderedProgress = computed(() => {
    if (typeof progress === 'number') {
        return progress;
    }

    return jobProgress.value;
});
const overflowWidthPercentage = computed(() =>
    renderedProgress.value > 1 ? 100 * ((renderedProgress.value - 1) / renderedProgress.value) : null);

watch(
    () => job,
    () => {
        cleanup && cleanup();

        jobProgress.value = job ? job.progress : 0;
        cleanup = job && job.listeners.add({ onUpdated: (value) => (jobProgress.value = value) });
    },
    { immediate: true },
);

onUnmounted(() => cleanup && cleanup());
</script>
