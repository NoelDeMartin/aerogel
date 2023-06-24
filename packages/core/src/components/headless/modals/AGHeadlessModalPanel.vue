<template>
    <DialogPanel>
        <slot />
        <AGModalContext v-if="childModal" :child-index="modal.childIndex + 1" :modal="childModal" />
    </DialogPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DialogPanel } from '@headlessui/vue';

import UI from '@/ui/UI';
import { injectReactiveOrFail } from '@/utils/vue';
import type { IAGModalContext } from '@/components/modals/AGModalContext';

import AGModalContext from '../../modals/AGModalContext.vue';

const modal = injectReactiveOrFail<IAGModalContext>('modal');
const childModal = computed(() => UI.modals[modal.childIndex] ?? null);
</script>
