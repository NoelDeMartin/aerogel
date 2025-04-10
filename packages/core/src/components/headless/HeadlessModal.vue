<template>
    <DialogRoot :ref="forwardRef" open @update:open="persistent || close()">
        <DialogPortal>
            <slot :close="close" />
        </DialogPortal>
    </DialogRoot>
</template>

<script setup lang="ts">
import { provide, ref } from 'vue';
import { DialogPortal, DialogRoot, useForwardExpose } from 'reka-ui';
import type { DialogContent } from 'reka-ui';
import type { Nullable } from '@noeldemartin/utils';

import Events from '@aerogel/core/services/Events';
import { useEvent } from '@aerogel/core/utils/composition/events';
import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import type { AcceptRefs } from '@aerogel/core/utils/vue';
import type { UIModalContext } from '@aerogel/core/ui/UI.state';
import type { ModalExpose, ModalProps, ModalSlots } from '@aerogel/core/components/contracts/Modal';

const $content = ref<Nullable<InstanceType<typeof DialogContent>>>(null);

defineProps<ModalProps>();
defineSlots<ModalSlots>();
defineExpose<AcceptRefs<ModalExpose>>({ close, $content });

const { forwardRef, currentElement } = useForwardExpose();
const hidden = ref(true);
const closed = ref(false);
const { modal } = injectReactiveOrFail<UIModalContext>(
    'modal',
    'could not obtain modal reference from <HeadlessModal>, ' +
        'did you render this component manually? Show it using $ui.openModal() instead',
);

provide('$modalContentRef', $content);

useEvent('close-modal', async ({ id, result }) => {
    if (id !== modal.id) {
        return;
    }

    await close(result);
});

useEvent('hide-modal', async ({ id }) => {
    if (id !== modal.id) {
        return;
    }

    await hide();
});

useEvent('show-modal', async ({ id }) => {
    if (id !== modal.id) {
        return;
    }

    await show();
});

async function hide(): Promise<void> {
    if (!currentElement.value) {
        return;
    }

    hidden.value = true;
}

async function show(): Promise<void> {
    if (!currentElement.value) {
        return;
    }

    hidden.value = false;
}

async function close(result?: unknown) {
    if (closed.value) {
        return;
    }

    Events.emit('modal-will-close', { modal, result });

    await hide();

    closed.value = true;

    Events.emit('modal-closed', { modal, result });
}
</script>
