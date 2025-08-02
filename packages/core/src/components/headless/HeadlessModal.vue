<template>
    <DialogRoot :ref="forwardRef" open @update:open="persistent || close()">
        <DialogPortal>
            <slot :close />
        </DialogPortal>
    </DialogRoot>
</template>

<script setup lang="ts" generic="T = void">
import { DialogPortal, DialogRoot, useForwardExpose } from 'reka-ui';
import { provide, ref } from 'vue';
import type { DialogContent } from 'reka-ui';
import type { Nullable } from '@noeldemartin/utils';

import { useModal } from '@aerogel/core/ui/modals';
import type { AcceptRefs } from '@aerogel/core/utils/vue';
import type { ModalExpose, ModalProps, ModalSlots } from '@aerogel/core/components/contracts/Modal';

const $content = ref<Nullable<InstanceType<typeof DialogContent>>>(null);
const { close } = useModal<T>();

defineProps<ModalProps>();
defineSlots<ModalSlots<T>>();
defineExpose<AcceptRefs<ModalExpose>>({ $content });

const { forwardRef } = useForwardExpose();

provide('$modalContentRef', $content);
</script>
