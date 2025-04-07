<template>
    <div class="mb-4 flex flex-row items-center justify-between" :class="{ 'w-full': source }">
        <div class="flex flex-row items-center gap-2">
            <h2 class="text-xl">
                <slot />
            </h2>
            <Button
                v-if="sourceUrl"
                variant="ghost"
                size="icon"
                class="p-0 text-gray-600 hover:text-gray-800"
                :href="sourceUrl"
                :title="$t('app.viewPageSource')"
                :aria-label="$t('app.viewPageSource')"
            >
                <i-mdi-github class="size-5" />
            </Button>
        </div>
        <slot name="end" />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const { source } = defineProps<{ source?: string }>();
const sourceUrl = computed(() => {
    if (!source) {
        return;
    }

    return `https://github.com/noeldemartin/aerogel/blob/main/playground/${source}`;
});
</script>
