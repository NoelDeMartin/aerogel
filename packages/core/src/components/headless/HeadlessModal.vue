<template>
    <DialogRoot ref="$root" :open="true" @update:open="persistent || close()">
        <DialogPortal>
            <slot :close="close" />
        </DialogPortal>
    </DialogRoot>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { DialogPortal, DialogRoot } from 'reka-ui';

import Events from '@aerogel/core/services/Events';
import { useEvent } from '@aerogel/core/utils/composition/events';
import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import type { IAGModalContext } from '@aerogel/core/components/modals/AGModalContext';
import type { ModalProps, ModalSlots } from '@aerogel/core/components/contracts/Modal';

defineProps<ModalProps>();
defineSlots<ModalSlots>();

const $root = ref<{ $el?: HTMLElement } | null>(null);
const hidden = ref(true);
const closed = ref(false);
const { modal } = injectReactiveOrFail<IAGModalContext>(
    'modal',
    'could not obtain modal reference from <HeadlessModal>, ' +
        'did you render this component manually? Show it using $ui.openModal() instead',
);

async function hide(): Promise<void> {
    if (!$root.value?.$el) {
        return;
    }

    hidden.value = true;
}

async function show(): Promise<void> {
    if (!$root.value?.$el) {
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
</script>
