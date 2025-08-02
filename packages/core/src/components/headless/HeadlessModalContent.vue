<template>
    <DialogContent ref="$contentRef">
        <slot />

        <ModalComponent :is="child" v-if="child" />
    </DialogContent>
</template>

<script setup lang="ts">
import { useTemplateRef, watchEffect } from 'vue';
import { DialogContent } from 'reka-ui';
import type { Ref } from 'vue';

import { ModalComponent, useModal } from '@aerogel/core/ui/modals';
import { injectOrFail } from '@aerogel/core/utils/vue';
import type { ModalContentInstance } from '@aerogel/core/components/contracts/Modal';

const { child } = useModal();
const $modalContentRef = injectOrFail<Ref<ModalContentInstance>>('$modalContentRef');
const $content = useTemplateRef('$contentRef');

watchEffect(() => ($modalContentRef.value = $content.value));
</script>
