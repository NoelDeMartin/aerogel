<template>
    <component :is="modal.component" v-bind="modalProperties" />
</template>

<script setup lang="ts">
import { computed, provide, toRef, unref } from 'vue';

import { numberProp, requiredObjectProp } from '@aerogel/core/utils/vue';
import type { Modal } from '@aerogel/core/ui/UI.state';

import type { IAGModalContext } from './AGModalContext';

const props = defineProps({
    modal: requiredObjectProp<Modal>(),
    childIndex: numberProp(0),
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
