<template>
    <DialogRoot :ref="forwardRef" open @update:open="persistent || close()">
        <DialogPortal>
            <slot :close />
        </DialogPortal>
    </DialogRoot>
</template>

<script setup lang="ts" generic="T = void">
import { after } from '@noeldemartin/utils';
import { DialogPortal, DialogRoot, useForwardExpose } from 'reka-ui';
import { provide, ref } from 'vue';
import { useModal } from '@noeldemartin/vue-modals';
import type { DialogContent } from 'reka-ui';
import type { Nullable } from '@noeldemartin/utils';

import type { AcceptRefs } from '@aerogel/core/utils/vue';
import type { ModalExpose, ModalProps, ModalSlots } from '@aerogel/core/components/contracts/Modal';

const $content = ref<Nullable<InstanceType<typeof DialogContent>>>(null);
const modal = useModal<T>({ removeOnClose: false });

defineProps<ModalProps>();
defineSlots<ModalSlots<T>>();
defineExpose<AcceptRefs<ModalExpose>>({ $content });

const { forwardRef } = useForwardExpose();

provide('$modalContentRef', $content);

async function close(result?: T) {
    modal.close(result);

    await after(1000);

    modal.remove();
}
</script>
