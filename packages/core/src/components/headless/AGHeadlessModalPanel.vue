<template>
    <DialogPanel>
        <slot />
        <AGModalContext v-if="childModal" :child-index="childIndex + 1" :modal="childModal" />
    </DialogPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DialogPanel } from '@headlessui/vue';

import { injectOrFail } from '@/utils/vue';
import { UI } from '@/services';
import type { IAGModalContext } from '@/components/AGModalContext';

import AGModalContext from '../AGModalContext.vue';

const { childIndex } = injectOrFail<IAGModalContext>('modal');
const childModal = computed(() => UI.modals[childIndex.value] ?? null);
</script>
