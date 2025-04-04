<template>
    <Story group="modals" :layout="{ type: 'grid' }">
        <Variant title="Playground">
            <Button @click="showModal()">
                Show modal
            </Button>

            <AGAppOverlays />

            <template #controls>
                <HstText v-model="title" title="Title" />
                <HstText v-model="content" title="Content" />
                <HstCheckbox v-model="cancellable" title="Cancellable" />
            </template>
        </Variant>
    </Story>
</template>

<script setup lang="ts">
import { h, ref } from 'vue';
import { UI } from '@aerogel/core';

import BaseModal from './BaseModal.vue';

const title = ref('Hello!');
const content = ref('Modals can be easy');
const cancellable = ref(true);

function showModal() {
    UI.openModal({
        render() {
            return h(BaseModal, { title: title.value, cancellable: cancellable.value }, () => h('div', content.value));
        },
    });
}
</script>
