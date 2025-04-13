<template>
    <DialogRoot :ref="forwardRef" open @update:open="persistent || close()">
        <DialogPortal>
            <slot :close="close" />
        </DialogPortal>
    </DialogRoot>
</template>

<script setup lang="ts" generic="T = void">
import { provide, ref } from 'vue';
import { DialogPortal, DialogRoot, useForwardExpose } from 'reka-ui';
import type { DialogContent } from 'reka-ui';
import type { Nullable } from '@noeldemartin/utils';

import Events from '@aerogel/core/services/Events';
import { useEvent } from '@aerogel/core/utils/composition/events';
import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import type { AcceptRefs } from '@aerogel/core/utils/vue';
import type { UIModalContext } from '@aerogel/core/ui/UI';
import type { ModalExpose, ModalProps, ModalSlots } from '@aerogel/core/components/contracts/Modal';

const $content = ref<Nullable<InstanceType<typeof DialogContent>>>(null);
const { modal } = injectReactiveOrFail<UIModalContext>(
    'modal',
    'could not obtain modal reference from <HeadlessModal>, ' +
        'did you render this component manually? Show it using $ui.modal() instead',
);

defineProps<ModalProps>();
defineSlots<ModalSlots<T>>();
defineExpose<AcceptRefs<ModalExpose<T>>>({ close, $content });

const { forwardRef } = useForwardExpose();
const closed = ref(false);

provide('$modalContentRef', $content);

useEvent('close-modal', async ({ id, result }) => {
    if (id !== modal.id) {
        return;
    }

    await close(result);
});

async function close(result?: unknown) {
    if (closed.value) {
        return;
    }

    await Events.emit('modal-will-close', { modal, result });

    closed.value = true;

    await Events.emit('modal-has-closed', { modal, result });
}
</script>
