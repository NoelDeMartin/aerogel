<template>
    <aside v-if="modal">
        <AGModalContext :child-index="1" :modal="modal" />
    </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import UI from '@/ui/UI';

import AGModalContext from './modals/AGModalContext.vue';

const modal = computed(() => UI.modals[0] ?? null);
</script>
