<template>
    <component :is="modal.component" v-bind="modalProperties" />
</template>

<script setup lang="ts">
import { computed, provide, toRef, unref } from 'vue';

import type { UIModal, UIModalContext } from '@aerogel/core/ui/UI.state';
import type { AcceptRefs } from '@aerogel/core/utils/vue';

const props = defineProps<{
    modal: UIModal;
    childIndex?: number;
}>();

const modalProperties = computed(() => {
    const properties = {} as typeof props.modal.properties;

    for (const property in props.modal.properties) {
        properties[property] = unref(props.modal.properties[property]);
    }

    return properties;
});

provide<AcceptRefs<UIModalContext>>('modal', {
    modal: toRef(props, 'modal'),
    childIndex: toRef(props, 'childIndex'),
});
</script>
