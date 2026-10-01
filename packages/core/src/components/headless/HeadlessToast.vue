<template>
    <ToastRoot>
        <slot>
            <span v-if="message">{{ message }}</span>
            <HeadlessToastAction v-for="(action, key) of actions" :key :action />
        </slot>
    </ToastRoot>
</template>

<script setup lang="ts">
import type { ToastProps } from '@aerogel/core/components/contracts/Toast';
import { ToastRoot } from 'reka-ui';

import HeadlessToastAction from './HeadlessToastAction.vue';

defineProps<ToastProps>();
</script>
