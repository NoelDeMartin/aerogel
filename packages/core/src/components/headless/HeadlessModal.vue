<template>
    <DialogRoot :ref="forwardRef" open @update:open="persistent || $event || close()">
        <DialogPortal>
            <slot :close />
        </DialogPortal>
    </DialogRoot>
</template>

<script setup lang="ts" generic="T = void">
import type { ModalExpose, ModalProps, ModalSlots } from '@aerogel/core/components/contracts/Modal';
import { useModal } from '@aerogel/core/ui/modals';
import { useForwardExpose } from '@aerogel/core/utils/composition/expose';
import type { AcceptRefs } from '@aerogel/core/utils/vue';
import type { Nullable } from '@noeldemartin/utils';
import { DialogPortal, DialogRoot } from 'reka-ui';
import type { DialogContent } from 'reka-ui';
import { provide, ref } from 'vue';

const $content = ref<Nullable<InstanceType<typeof DialogContent>>>(null);
const { close } = useModal<T>();

defineProps<ModalProps>();
defineSlots<ModalSlots<T>>();
defineExpose<AcceptRefs<ModalExpose>>({ $content });

const { forwardRef } = useForwardExpose();

provide('$modalContentRef', $content);
</script>
