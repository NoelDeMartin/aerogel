<template>
    <div ref="$backdrop" class="pointer-events-none fixed inset-0 z-50 bg-black/30 opacity-0" />
    <aside v-if="modal">
        <AGModalContext :child-index="1" :modal="modal" />
    </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { UI } from '@/services/UI';
import { useEvent } from '@/utils/composition/events';

import AGModalContext from './AGModalContext.vue';

const $backdrop = ref<HTMLElement | null>(null);
const backdropHidden = ref(true);
const modal = computed(() => UI.modals[0] ?? null);

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
