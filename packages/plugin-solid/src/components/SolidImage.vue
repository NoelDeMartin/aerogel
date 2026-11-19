<template>
    <img :src="sourceUrl" />
</template>

<script setup lang="ts">
import { useSolidFile } from '@aerogel/plugin-solid/composables/useSolidFile';
import { isLocalUrl } from 'soukai-bis';
import { computed } from 'vue';

const { src } = defineProps<{ src: string }>();
const file = useSolidFile(() => src);
const sourceUrl = computed(() => {
    if (file.url.value) {
        return file.url.value;
    }

    return file.loading.value || isLocalUrl(src) ? undefined : src;
});
</script>
