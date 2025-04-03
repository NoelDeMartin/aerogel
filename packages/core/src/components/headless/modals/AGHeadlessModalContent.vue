<template>
    <DialogContent>
        <slot />

        <AGModalContext v-if="childModal" :child-index="childIndex + 1" :modal="childModal" />
    </DialogContent>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DialogContent } from 'reka-ui';

import UI from '@aerogel/core/ui/UI';
import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import type { IAGModalContext } from '@aerogel/core/components/modals/AGModalContext';

import AGModalContext from '../../modals/AGModalContext.vue';

const { childIndex } = injectReactiveOrFail<IAGModalContext>(
    'modal',
    'could not obtain modal reference from <AGHeadlessModalContent>, ' +
        'did you render this component manually? Show it using $ui.openModal() instead',
);
const childModal = computed(() => UI.modals[childIndex] ?? null);
</script>
