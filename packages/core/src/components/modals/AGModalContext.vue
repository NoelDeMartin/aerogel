<template>
    <component :is="modal.component" v-bind="modalProperties" />
</template>

<script setup lang="ts">
import { computed, provide, toRef, unref } from 'vue';

import { requiredNumberProp, requiredObjectProp } from '@/utils/vue';
import type { Modal } from '@/ui/UI.state';

import type { IAGModalContext } from './AGModalContext';

const props = defineProps({
    modal: requiredObjectProp<Modal>(),
    childIndex: requiredNumberProp(),
});

const modalProperties = computed(() => {
    const properties = {} as typeof props.modal.properties;

    for (const property in props.modal.properties) {
        properties[property] = unref(props.modal.properties[property]);
    }

    return properties;
});

provide<IAGModalContext>('modal', {
    modal: toRef(props, 'modal'),
    childIndex: toRef(props, 'childIndex'),
});
</script>
