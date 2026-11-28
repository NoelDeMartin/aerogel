<template>
    <DialogContent ref="$contentRef" force-mount>
        <slot />
    </DialogContent>
</template>

<script setup lang="ts">
import type { ModalContentInstance } from '@aerogel/core/components/contracts/Modal';
import { useModal } from '@aerogel/core/ui/modals';
import { injectOrFail } from '@aerogel/core/utils/vue';
import type { Nullable } from '@noeldemartin/utils';
import { DialogContent } from 'reka-ui';
import { useTemplateRef, watch, watchEffect } from 'vue';
import type { Ref } from 'vue';

const { visible } = useModal();
const $modalContentRef = injectOrFail<Ref<ModalContentInstance>>('$modalContentRef');
const $content = useTemplateRef('$contentRef');
const previouslyFocusedElement = document.activeElement;

function contentHasFocus(): boolean {
    const contentElement = $content.value?.$el as Nullable<HTMLElement>;

    return !!contentElement?.contains(document.activeElement);
}

function restorePreviousFocus(): void {
    if (
        !contentHasFocus() ||
        !(previouslyFocusedElement instanceof HTMLElement) ||
        !previouslyFocusedElement.isConnected
    ) {
        return;
    }

    previouslyFocusedElement.focus();
}

watchEffect(() => ($modalContentRef.value = $content.value));

watch(visible, (isVisible) => {
    if (isVisible) {
        return;
    }

    restorePreviousFocus();
});
</script>
