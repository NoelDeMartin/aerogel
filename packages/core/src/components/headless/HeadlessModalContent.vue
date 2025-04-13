<template>
    <DialogContent ref="$contentRef">
        <slot />

        <ModalContext v-if="childModal" :child-index="childIndex + 1" :modal="childModal" />
    </DialogContent>
</template>

<script setup lang="ts">
import { computed, useTemplateRef, watchEffect } from 'vue';
import { DialogContent } from 'reka-ui';
import type { Ref } from 'vue';

import ModalContext from '@aerogel/core/components/ui/ModalContext.vue';
import UI from '@aerogel/core/ui/UI';
import { injectOrFail, injectReactiveOrFail } from '@aerogel/core/utils/vue';
import type { UIModalContext } from '@aerogel/core/ui/UI';
import type { ModalContentInstance } from '@aerogel/core/components/contracts/Modal';

const { childIndex = 0 } = injectReactiveOrFail<UIModalContext>(
    'modal',
    'could not obtain modal reference from <HeadlessModalContent>, ' +
        'did you render this component manually? Show it using $ui.openModal() instead',
);
const $modalContentRef = injectOrFail<Ref<ModalContentInstance>>('$modalContentRef');
const $content = useTemplateRef('$contentRef');
const childModal = computed(() => UI.modals[childIndex] ?? null);

watchEffect(() => ($modalContentRef.value = $content.value));
</script>
