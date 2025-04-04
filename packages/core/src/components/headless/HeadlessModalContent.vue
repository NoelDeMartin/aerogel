<template>
    <DialogContent>
        <slot />

        <ModalContext v-if="childModal" :child-index="childIndex + 1" :modal="childModal" />
    </DialogContent>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DialogContent } from 'reka-ui';

import ModalContext from '@aerogel/core/components/ui/ModalContext.vue';
import UI from '@aerogel/core/ui/UI';
import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import type { UIModalContext } from '@aerogel/core/ui/UI.state';

const { childIndex = 0 } = injectReactiveOrFail<UIModalContext>(
    'modal',
    'could not obtain modal reference from <HeadlessModalContent>, ' +
        'did you render this component manually? Show it using $ui.openModal() instead',
);
const childModal = computed(() => UI.modals[childIndex] ?? null);
</script>
