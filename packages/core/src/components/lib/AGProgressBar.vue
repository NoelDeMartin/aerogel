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

import { numberProp, objectProp, stringProp } from '@aerogel/core/utils/vue';
import type { Job } from '@aerogel/core/jobs';

const props = defineProps({
    progress: numberProp(),
    barClass: stringProp(''),
    job: objectProp<Job>(),
});

let cleanup: Function | undefined;
const jobProgress = ref(0);
const barClasses = computed(() => {
    const classes = props.barClass ?? '';

    return `size-full transition-transform duration-500 ease-linear ${
        classes.includes('bg-') ? classes : `${classes} bg-gray-700`
    }`;
});
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
