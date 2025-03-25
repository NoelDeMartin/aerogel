<template>
    <component
        :is="rootComponent"
        ref="$root"
        :open="true"
        @close="cancellable && close()"
    >
        <slot :close="close" />
    </component>
</template>

<script setup lang="ts">
import { computed, ref, toRef } from 'vue';
import { Dialog } from '@headlessui/vue';
import type { VNode } from 'vue';

import Events from '@aerogel/core/services/Events';
import { useEvent } from '@aerogel/core/utils/composition/events';
import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import type { IAGModalContext } from '@aerogel/core/components/modals/AGModalContext';

import { useModalProps } from './AGHeadlessModal';
import type { IAGHeadlessModal, IAGHeadlessModalDefaultSlotProps } from './AGHeadlessModal';

const props = defineProps(useModalProps());
const $root = ref<{ $el?: HTMLElement } | null>(null);
const hidden = ref(true);
const closed = ref(false);
const { modal } = injectReactiveOrFail<IAGModalContext>(
    'modal',
    'could not obtain modal reference from <AGHeadlessModal>, ' +
        'did you render this component manually? Show it using $ui.openModal() instead',
);
const rootComponent = computed(() => (modal.properties.inline ? 'div' : Dialog));

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

defineSlots<{ default(props: IAGHeadlessModalDefaultSlotProps): VNode[] }>();
defineExpose<IAGHeadlessModal>({ close, cancellable: toRef(props, 'cancellable'), inline: toRef(props, 'inline') });
</script>
