<template>
    <img :src="sourceUrl">
</template>

<script setup lang="ts">
import { Cache, computedAsync, requiredStringProp } from '@aerogel/core';

import Solid from '@/services/Solid';

const props = defineProps({ src: requiredStringProp() });
const sourceUrl = computedAsync(async () => {
    const cachedResponse = (await Cache.get(props.src)) ?? (await downloadImage(props.src));
    const blob = await cachedResponse?.blob();

    return blob && URL.createObjectURL(blob);
});

async function downloadImage(url: string) {
    try {
        const response = await Solid.fetch(url);

        if (response.status !== 200) {
            return null;
        }

        await Cache.store(url, response);

        return Cache.get(url);
    } catch (error) {
        return null;
    }
}
</script>
