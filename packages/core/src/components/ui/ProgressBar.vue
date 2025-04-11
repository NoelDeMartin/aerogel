<template>
    <div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div :class="filledClasses" :style="`transform:translateX(-${(1 - renderedProgress) * 100}%)`" />
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

const { filledClass, progress, job } = defineProps<{
    filledClass?: string;
    progress?: number;
    job?: Falsifiable<Job>;
}>();

let cleanup: Falsifiable<Function>;
const jobProgress = ref(0);
const filledClasses = computed(() =>
    classes('size-full transition-transform duration-500 rounded-r-full ease-linear bg-primary-600', filledClass));
const renderedProgress = computed(() => {
    if (typeof progress === 'number') {
        return progress;
    }

    return jobProgress.value;
});

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
