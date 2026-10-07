<template>
    <img :src="sourceUrl" />
</template>

<script setup lang="ts">
import { NetworkCache, computedAsync } from '@aerogel/core';
import Solid from '@aerogel/plugin-solid/services/Solid';

const { src } = defineProps<{ src: string }>();
const sourceUrl = computedAsync(async () => {
    const cachedResponse = (await NetworkCache.get(src)) ?? (await downloadImage(src));
    const blob = await cachedResponse?.blob();

    return (blob && URL.createObjectURL(blob)) || src;
});

async function downloadImage(url: string) {
    try {
        const response = await Solid.fetch(url);

        if (response.status !== 200) {
            return null;
        }

        await NetworkCache.store(url, response);

        return NetworkCache.get(url);
    } catch (error) {
        return null;
    }
}
</script>
