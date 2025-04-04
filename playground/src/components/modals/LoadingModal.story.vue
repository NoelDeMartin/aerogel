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
        <Variant title="Default">
            <AGModalContext :modal="defaultModal" />
        </Variant>
        <Variant title="Progress">
            <AGModalContext :modal="progressModal" />
        </Variant>
        <Variant title="Title">
            <AGModalContext :modal="titleModal" />
        </Variant>
        <Variant title="Title + Progress">
            <AGModalContext :modal="titleAndProgressModal" />
        </Variant>
    </Story>
</template>

<script setup lang="ts">
import { after, uuid } from '@noeldemartin/utils';
import { h, ref } from 'vue';
import { UI } from '@aerogel/core';

import LoadingModal from './LoadingModal.vue';

const start = Date.now();
const speed = 10000;
const title = ref('Loading');
const message = ref('Loading...');
const progress = ref(0);
const defaultModal = {
    id: uuid(),
    component: LoadingModal,
    properties: { message },
};
const progressModal = {
    id: uuid(),
    component: LoadingModal,
    properties: { message, progress },
};
const titleModal = {
    id: uuid(),
    component: LoadingModal,
    properties: { title, message },
};
const titleAndProgressModal = {
    id: uuid(),
    component: LoadingModal,
    properties: { title, message, progress },
};

setInterval(() => {
    progressModal.properties.progress.value = Math.round((((Date.now() - start) % speed) / speed) * 100) / 100;
}, 100);

async function showModal() {
    const modal = await UI.openModal({
        render() {
            return h(LoadingModal, { message: message.value });
        },
    });

    after({ seconds: 5 }).then(() => UI.closeModal(modal.id));
}
</script>

<style>
.story-loadingmodal {
    grid-template-columns: 500px !important;
}
</style>
