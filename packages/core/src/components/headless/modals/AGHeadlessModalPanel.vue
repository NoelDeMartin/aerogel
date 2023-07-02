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

const modal = injectReactiveOrFail<IAGModalContext>(
    'modal',
    'could not obtain modal reference from <AGHeadlessModalPanel>, ' +
        'did you render this component manually? Show it using $ui.openModal() instead',
);
const childModal = computed(() => UI.modals[modal.childIndex] ?? null);
</script>
