<template>
    <Story group="modals" :layout="{ type: 'grid' }">
        <Variant title="Playground">
            <Button @click="showModal()">
                Show modal
            </Button>

            <AGAppOverlays />

            <template #controls>
                <HstText v-model="title" title="Title" />
                <HstText v-model="message" title="Message" />
            </template>
        </Variant>
    </Story>
</template>

<script setup lang="ts">
import { h, ref } from 'vue';
import { UI } from '@aerogel/core';

import AlertModal from './AlertModal.vue';

const title = ref('Hello!');
const message = ref('Modals can be easy');

function showModal() {
    UI.openModal({
        render() {
            return h(AlertModal, { title: title.value, message: message.value });
        },
    });
}
</script>
