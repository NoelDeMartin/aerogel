<template>
    <div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div :class="barClasses" :style="`transform:translateX(-${(1 - renderedProgress) * 100}%)`" />
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
import { twMerge } from 'tailwind-merge';

import { numberProp, objectProp, stringProp } from '@/utils/vue';
import type { Job } from '@/jobs';

const props = defineProps({
    progress: numberProp(),
    barClass: stringProp(''),
    job: objectProp<Job>(),
});

let cleanup: Function | undefined;
const jobProgress = ref(0);
const barClasses = computed(() =>
    twMerge('h-full w-full transition-transform duration-500 ease-linear rounded-full bg-gray-700', props.barClass));
const renderedProgress = computed(() => {
    if (typeof props.progress === 'number') {
        return props.progress;
    }

    return jobProgress.value;
});

watch(
    () => props.job,
    () => {
        cleanup?.();

        jobProgress.value = props.job?.progress ?? 0;
        cleanup = props.job?.listeners.add({ onUpdated: (progress) => (jobProgress.value = progress) });
    },
    { immediate: true },
);

onUnmounted(() => cleanup?.());
</script>
