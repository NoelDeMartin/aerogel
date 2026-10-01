<template>
    <component :is="action.dismiss ? ToastClose : 'button'" type="button" @click="action.click">
        {{ action.label }}
    </component>
</template>

<script setup lang="ts">
import type { ToastAction as IToastAction } from '@aerogel/core/components/contracts/Toast';
import { ToastClose } from 'reka-ui';

defineProps<{ action: IToastAction }>();
</script>
