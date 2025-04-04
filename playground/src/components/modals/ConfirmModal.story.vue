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

import ConfirmModal from './ConfirmModal.vue';

const title = ref('');
const message = ref('Are you sure?');

async function showModal() {
    const modal = await UI.openModal({
        render() {
            return h(ConfirmModal, { title: title.value, message: message.value });
        },
    });

    const result = await modal.afterClose;

    UI.alert(result ? 'Confirmed' : 'Cancelled');
}
</script>
