<template>
    <aside v-if="modal">
        <ModalContext :child-index="1" :modal="modal" />
    </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import ModalContext from '@aerogel/core/components/ui/ModalContext.vue';
import UI from '@aerogel/core/ui/UI';

const modal = computed(() => UI.modals[0] ?? null);
</script>
