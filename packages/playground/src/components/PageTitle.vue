<template>
    <div class="mb-4 flex flex-row items-center justify-between">
        <h2 class="text-xl">
            <slot />
        </h2>
        <a
            v-if="sourceUrl"
            :href="sourceUrl"
            target="_blank"
            class="flex flex-row items-center text-sm text-gray-600 hover:text-gray-500 hover:underline"
        >
            <i-mdi-github class="mr-1 h-4 w-4" aria-hidden="true" />
            <span>{{ $t('app.viewPageSource') }}</span>
        </a>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { stringProp } from '@aerogel/core';

const props = defineProps({ source: stringProp() });
const sourceUrl = computed(() => {
    if (!props.source) {
        return;
    }

    return `https://github.com/noeldemartin/aerogel/blob/main/packages/playground/${props.source}`;
});
</script>
