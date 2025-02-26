<template>
    <div class="mt-1 h-2 w-full min-w-[min(400px,80vw)] overflow-hidden rounded-full bg-gray-200">
        <div :class="barClasses" :style="`transform:translateX(-${(1 - progress) * 100}%)`" />
        <span class="sr-only">
            {{
                $td('ui.progress', '{progress}% complete', {
                    progress: progress * 100,
                })
            }}
        </span>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { requiredNumberProp, stringProp } from '@/utils/vue';

const props = defineProps({
    progress: requiredNumberProp(),
    class: stringProp(''),
});
const barClasses = computed(() => {
    const classes = props.class ?? '';

    return `h-full w-full transition-transform duration-500 ease-linear ${
        classes.includes('bg-') ? classes : `${classes} bg-gray-700`
    }`;
});
</script>
