<template>
    <div
        id="aerogel-overlays-backdrop"
        ref="$backdrop"
        class="pointer-events-none fixed inset-0 z-50 bg-black/30 opacity-0"
    />
    <AppModals />
    <AppSnackbars />
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { useEvent } from '@aerogel/core/utils/composition/events';

import AppModals from './AppModals.vue';
import AppSnackbars from './AppSnackbars.vue';

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
