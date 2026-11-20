<template>
    <img :src="sourceUrl" />
</template>

<script setup lang="ts">
import { useSolidFile } from '@aerogel/plugin-solid/composables/useSolidFile';
import { isLocalUrl } from 'soukai-bis';
import { computed } from 'vue';

const { src } = defineProps<{ src: string }>();
const { url, loading } = useSolidFile(() => src);
const sourceUrl = computed(() => {
    if (url.value) {
        return url.value;
    }

    return loading.value || isLocalUrl(src) ? undefined : src;
});
</script>
