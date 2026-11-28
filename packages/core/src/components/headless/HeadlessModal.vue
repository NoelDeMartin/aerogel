<template>
    <DialogRoot
        v-if="renderDialog"
        v-bind="$attrs"
        :ref="forwardRef"
        :open="visible"
        :modal="!metadata.inline"
        @update:open="persistent || metadata.inline || $event || close()"
    >
        <DialogPortal :disabled="metadata.inline">
            <slot :close />
        </DialogPortal>
    </DialogRoot>

    <ModalComponent v-if="child" :is="child" />
</template>

<script setup lang="ts" generic="T = void">
import type { ModalExpose, ModalProps, ModalSlots } from '@aerogel/core/components/contracts/Modal';
import { MODAL_CLOSE_ANIMATION_DURATION, ModalComponent, useModal } from '@aerogel/core/ui/modals';
import { useForwardExpose } from '@aerogel/core/utils/composition/expose';
import type { AcceptRefs } from '@aerogel/core/utils/vue';
import { after } from '@noeldemartin/utils';
import type { Nullable } from '@noeldemartin/utils';
import { DialogPortal, DialogRoot } from 'reka-ui';
import type { DialogContent } from 'reka-ui';
import { provide, ref, watch } from 'vue';

const $content = ref<Nullable<InstanceType<typeof DialogContent>>>(null);
const { close, metadata, visible, child } = useModal<T>();
const renderDialog = ref(true);

defineOptions({ inheritAttrs: false });
defineProps<ModalProps>();
defineSlots<ModalSlots<T>>();
defineExpose<AcceptRefs<ModalExpose>>({ $content });

const { forwardRef } = useForwardExpose();

provide('$modalContentRef', $content);

async function unmountDialogAfterClosingAnimation(): Promise<void> {
    await after(MODAL_CLOSE_ANIMATION_DURATION);

    renderDialog.value = visible.value;
}

watch(visible, (isVisible) => {
    if (!isVisible) {
        void unmountDialogAfterClosingAnimation();

        return;
    }

    renderDialog.value = true;
});
</script>
