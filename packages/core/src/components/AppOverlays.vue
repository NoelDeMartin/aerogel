<template>
    <AppModals />
    <AppToasts />
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { useEvent } from '@aerogel/core/utils/composition/events';

import AppModals from './AppModals.vue';
import AppToasts from './AppToasts.vue';

const $backdrop = ref<HTMLElement | null>(null);
const backdropHidden = ref(true);

useEvent('show-overlays-backdrop', async () => {
    if (!$backdrop.value || !backdropHidden.value) {
        return;
    }

    backdropHidden.value = false;

    $backdrop.value.classList.remove('opacity-0');
});

useEvent('hide-overlays-backdrop', async () => {
    if (!$backdrop.value || backdropHidden.value) {
        return;
    }

    backdropHidden.value = true;

    $backdrop.value.classList.add('opacity-0');
});
</script>
