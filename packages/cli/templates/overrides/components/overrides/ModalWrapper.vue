<template>
    <AGHeadlessModal ref="$modal" v-slot="{ close }" v-bind="props">
        <AGHeadlessModalPanel>
            <AGHeadlessModalTitle v-if="title">
                <Markdown :text="title" inline />
            </AGHeadlessModalTitle>
            <slot :close="close" />
        </AGHeadlessModalPanel>
    </AGHeadlessModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { modalExpose, modalProps } from '@aerogel/core';
import type { IAGHeadlessModal, IAGModal } from '@aerogel/core';

const props = defineProps(modalProps());
const $modal = ref<IAGHeadlessModal>();

defineOptions({ inheritAttrs: false });
defineExpose(modalExpose($modal));
</script>
