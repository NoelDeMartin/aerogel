<template>
    <component :is="rootComponent">
        <slot />

        <template v-if="childModal">
            <div
                class="pointer-events-none inset-0 z-50 bg-black/30"
                :class="childModal.properties.inline ? 'absolute' : 'fixed'"
            />
            <AGModalContext :child-index="childIndex + 1" :modal="childModal" />
        </template>
    </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DialogPanel } from '@headlessui/vue';

import UI from '@aerogel/core/ui/UI';
import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import type { IAGModalContext } from '@aerogel/core/components/modals/AGModalContext';

import AGModalContext from '../../modals/AGModalContext.vue';

const { modal, childIndex } = injectReactiveOrFail<IAGModalContext>(
    'modal',
    'could not obtain modal reference from <AGHeadlessModalPanel>, ' +
        'did you render this component manually? Show it using $ui.openModal() instead',
);
const rootComponent = computed(() => (modal.properties.inline ? 'div' : DialogPanel));
const childModal = computed(() => UI.modals[childIndex] ?? null);
</script>
