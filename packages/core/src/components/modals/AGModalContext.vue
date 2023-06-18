<template>
    <component :is="modal.component" v-bind="modal.properties" />
</template>

<script setup lang="ts">
import { provide, toRef } from 'vue';

import { requiredNumberProp, requiredObjectProp } from '@/utils/vue';
import type { Modal } from '@/ui/UI.state';

import type { IAGModalContext } from './AGModalContext';

const props = defineProps({
    modal: requiredObjectProp<Modal>(),
    childIndex: requiredNumberProp(),
});

provide<IAGModalContext>('modal', {
    modal: toRef(props, 'modal'),
    childIndex: toRef(props, 'childIndex'),
});
</script>
