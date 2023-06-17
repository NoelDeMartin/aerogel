<template>
    <Dialog ref="$root" :open="true" @close="cancellable && close()">
        <slot :close="close" />
    </Dialog>
</template>

<script setup lang="ts">
import { ref, toRef } from 'vue';
import { Dialog } from '@headlessui/vue';
import type { VNode } from 'vue';

import Events from '@/services/Events';
import { useEvent } from '@/utils/composition/events';
import { booleanProp, injectOrFail } from '@/utils/vue';
import type { IAGModalContext } from '@/components/modals/AGModalContext';

import type { IAGHeadlessModal, IAGHeadlessModalDefaultSlotProps } from './AGHeadlessModal';

const props = defineProps({
    cancellable: booleanProp(true),
});

const $root = ref<{ $el?: HTMLElement } | null>(null);
const hidden = ref(true);
const closed = ref(false);
const { modal } = injectOrFail<IAGModalContext>('modal');

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

    Events.emit('modal-will-close', { modal: modal.value, result });

    await hide();

    closed.value = true;

    Events.emit('modal-closed', { modal: modal.value, result });
}

useEvent('close-modal', async ({ id, result }) => {
    if (id !== modal.value.id) {
        return;
    }

    await close(result);
});

useEvent('hide-modal', async ({ id }) => {
    if (id !== modal.value.id) {
        return;
    }

    await hide();
});

useEvent('show-modal', async ({ id }) => {
    if (id !== modal.value.id) {
        return;
    }

    await show();
});

defineSlots<{ default(props: IAGHeadlessModalDefaultSlotProps): VNode[] }>();
defineExpose<IAGHeadlessModal>({ close, cancellable: toRef(props, 'cancellable') });
</script>
