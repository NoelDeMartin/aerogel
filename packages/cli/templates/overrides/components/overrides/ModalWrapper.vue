<template>
    <AGHeadlessModal ref="$modal" v-slot="{ close }" v-bind="props">
        <AGHeadlessModalPanel>
            <AGHeadlessModalTitle v-if="title">
                <AGMarkdown :text="title" inline />
            </AGHeadlessModalTitle>
            <slot :close="close" />
        </AGHeadlessModalPanel>
    </AGHeadlessModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useModalExpose, useModalProps } from '@aerogel/core';
import type { IAGHeadlessModal, IAGModal } from '@aerogel/core';

const props = defineProps(useModalProps());
const $modal = ref<IAGHeadlessModal>();

defineOptions({ inheritAttrs: false });
defineExpose<IAGModal>(useModalExpose($modal));
</script>
