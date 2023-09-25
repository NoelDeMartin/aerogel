<template>
    <DialogPanel>
        <slot />

        <template v-if="childModal">
            <div class="pointer-events-none fixed inset-0 z-50 bg-black/30" />
            <AGModalContext :child-index="modal.childIndex + 1" :modal="childModal" />
        </template>
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
