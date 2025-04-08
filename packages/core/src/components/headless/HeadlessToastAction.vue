<template>
    <component :is="action.dismiss ? ToastClose : 'button'" type="button" @click="action.handler">
        {{ action.label }}
    </component>
</template>

<script setup lang="ts">
import { ToastClose } from 'reka-ui';

import type { ToastAction as IToastAction } from '@aerogel/core/components/contracts/Toast';

defineProps<{ action: IToastAction }>();
</script>
